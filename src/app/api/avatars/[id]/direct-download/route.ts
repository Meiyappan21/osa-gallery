import { NextRequest, NextResponse } from 'next/server';
import { getArweaveTxId } from '@/lib/arweaveMapping';
import { getArweaveUrl } from '@/lib/arweave';
import { getAvatars, getDownloadCounts, saveDownloadCounts } from '@/lib/github-storage';
import path from 'path';

// Define interfaces
interface DownloadCounts {
  counts: Record<string, number>;
}

interface AvatarMetadata {
  alternateModels?: {
    voxel?: string;
    voxel_vrm?: string;
    fbx?: string;
    'voxel-fbx'?: string;
    voxel_fbx?: string;
    [key: string]: string | undefined;
  };
  [key: string]: any;
}

interface Avatar {
  id: string;
  name: string;
  modelFileUrl: string | null;
  metadata: AvatarMetadata;
  [key: string]: any;
}

// Helper function to get model filename for a specific format
function getModelFilenameForFormat(
  avatar: Avatar,
  format: string | null
): string | null {
  if (!format || !avatar.metadata?.alternateModels) {
    return null;
  }
  
  const alternateModels = avatar.metadata.alternateModels;
  
  // Find the appropriate key based on the format
  if (format === 'fbx') {
    return alternateModels['fbx'] || null;
  }
  
  if (format === 'voxel') {
    return alternateModels['voxel_vrm'] || null;
  }
  
  if (format === 'voxel-fbx' || format === 'voxel_fbx') {
    return alternateModels['voxel_fbx'] || alternateModels['voxel-fbx'] || null;
  }
  
  return null;
}

// Helper to get file extension based on format
function getFileExtension(format: string): string {
  if (format === 'fbx' || format === 'voxel-fbx' || format === 'voxel_fbx') {
    return '.fbx';
  }
  return '.vrm'; // Default to VRM for any other format
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get format from query parameter
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || null;
    
    // Get avatar details from GitHub storage
    const avatars = await getAvatars();
    const avatar = avatars.find((a: Avatar) => a.id === params.id);

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    if (!avatar.modelFileUrl) {
      return NextResponse.json({ error: 'No model file available' }, { status: 400 });
    }

    let modelUrl = '';
    let actualFormat = format || 'default';
    
    // Check if a specific format was requested and if alternate models exist
    if (format && avatar.metadata?.alternateModels) {
      // Get model filename using our helper function
      const formatFilename = getModelFilenameForFormat(avatar, format);
      
      console.log('Download format requested:', format);
      console.log('Available alternate models:', JSON.stringify(avatar.metadata.alternateModels, null, 2));
      console.log('Format filename found:', formatFilename);
      
      if (formatFilename) {
        modelUrl = formatFilename;
      } else {
        // Format not found in alternate models - but instead of returning an error,
        // let's fallback to the default model and log a warning
        console.warn(`Requested format '${format}' not available for avatar '${avatar.name}'. Using default model instead.`);
        modelUrl = avatar.modelFileUrl;
        actualFormat = 'default'; // Reset to default format
      }
    } else {
      // Use the default model file URL
      modelUrl = avatar.modelFileUrl;
    }
    
    if (!modelUrl) {
      return NextResponse.json({ error: 'Could not determine model URL' }, { status: 400 });
    }
    
    // Create a proper filename
    const extension = getFileExtension(actualFormat);
    const cleanName = (avatar.name || avatar.metadata?.number || 'avatar').replace(/[^a-zA-Z0-9_-]/g, '_');
    const voxelPart = actualFormat && (actualFormat.includes('voxel') || actualFormat === 'voxel') ? '_voxel' : '';
    const filename = `${cleanName}${voxelPart}${extension}`;
    
    console.log(`Downloading ${filename} from ${modelUrl}`);
    
    try {
      // Fetch the file directly
      const response = await fetch(modelUrl);
      
      if (!response.ok) {
        return NextResponse.json({
          error: `Failed to fetch file: ${response.status} ${response.statusText}`
        }, { status: response.status });
      }
      
      // Get file buffer
      const buffer = await response.arrayBuffer();
      
      // Update download counts in the background
      try {
        const downloadCounts = await getDownloadCounts() as DownloadCounts;
        
        if (!downloadCounts.counts) {
          downloadCounts.counts = {};
        }
        
        downloadCounts.counts[avatar.id] = (downloadCounts.counts[avatar.id] || 0) + 1;
        saveDownloadCounts(downloadCounts).catch((err: Error) => 
          console.error('Failed to save download count:', err)
        );
      } catch (error) {
        console.error('Error updating download counts:', error);
        // Continue anyway
      }
      
      // Return the file with proper headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': actualFormat === 'fbx' ? 'application/octet-stream' : 'model/vrm',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=86400',
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      return NextResponse.json({
        error: 'Failed to download file',
        message: (error as Error).message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: (error as Error).message
    }, { status: 500 });
  }
} 