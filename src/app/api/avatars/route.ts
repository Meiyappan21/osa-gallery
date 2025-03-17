import { NextRequest, NextResponse } from 'next/server';
import { getArweaveTxId } from '@/lib/arweaveMapping';
import { getArweaveUrl } from '@/lib/arweave';
import { getAvatars, getProjects, saveAvatars } from '@/lib/github-storage';
import { GithubAvatar, GithubProject } from '@/types/github-storage';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  console.log('API Route: GET /api/avatars - Starting request');
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    console.log('Search params:', { search });

    // Check if user is authenticated and has admin/creator role
    let isAdmin = false;
    const sessionCookie = req.cookies.get('session');
    
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        isAdmin = ['admin', 'creator'].includes(sessionData.role);
      } catch (error) {
        console.error('Failed to parse session cookie:', error);
      }
    }

    // Fetch all avatars and projects from GitHub storage
    const [avatars, projects] = await Promise.all([
      getAvatars(),
      getProjects()
    ]);

    // Filter avatars based on search criteria and visibility
    const filteredAvatars = avatars.filter((avatar: GithubAvatar) => {
      // If user is admin, show all avatars
      // Otherwise, only show public avatars
      if (!isAdmin && !avatar.isPublic) return false;
      
      // Filter by search term if provided
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          avatar.name.toLowerCase().includes(searchLower) ||
          (avatar.description || '').toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
    
    // Sort by created date (newest first)
    const sortedAvatars = filteredAvatars.sort((a: GithubAvatar, b: GithubAvatar) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`Found ${sortedAvatars.length} avatars`);

    // Get project names for each avatar
    const projectMap = new Map<string, GithubProject>();
    projects.forEach((project: GithubProject) => {
      projectMap.set(project.id, project);
    });

    const transformedAvatars = sortedAvatars.map((avatar: GithubAvatar) => {
      // Get Arweave transaction IDs if available
      const modelFilename = avatar.modelFileUrl?.split('/').pop() || '';
      const thumbnailFilename = avatar.thumbnailUrl?.split('/').pop() || '';
      
      // Check if we have a mapping for this avatar in Arweave
      const modelTxId = getArweaveTxId(modelFilename, 'model');
      const thumbnailTxId = getArweaveTxId(thumbnailFilename, 'thumbnail');
      
      // Use Arweave URLs if available, otherwise fall back to the stored URLs
      const modelFileUrl = modelTxId ? getArweaveUrl(modelTxId) : avatar.modelFileUrl;
      const thumbnailUrl = thumbnailTxId ? getArweaveUrl(thumbnailTxId) : avatar.thumbnailUrl;
      
      // Get project name
      const project = projectMap.get(avatar.projectId);
      
      return {
        id: avatar.id,
        name: avatar.name,
        project: project?.name || 'Unknown Project',
        description: avatar.description || '',
        createdAt: avatar.createdAt,
        thumbnailUrl: thumbnailUrl,
        modelFileUrl: modelFileUrl,
        polygonCount: avatar.polygonCount || 0,
        format: avatar.format,
        materialCount: avatar.materialCount || 0,
        isPublic: avatar.isPublic,
        isDraft: avatar.isDraft,
        metadata: avatar.metadata || {}
      };
    });

    return NextResponse.json({ 
      avatars: transformedAvatars,
      _debug: {
        timestamp: new Date().toISOString(),
        count: transformedAvatars.length,
        storage: 'github+arweave' // Indicate that we're using GitHub + Arweave
      }
    });
  } catch (error) {
    console.error('Error fetching avatars:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch avatars',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication using session cookie instead of Bearer token
    const sessionCookie = req.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session format' }, { status: 401 });
    }

    if (!sessionData.userId || !['admin', 'creator'].includes(sessionData.role)) {
      return NextResponse.json({ error: 'Unauthorized - Insufficient permissions' }, { status: 403 });
    }
    
    // Parse the request body
    const avatarData = await req.json();
    
    // Validate required fields
    if (!avatarData.name || !avatarData.projectId) {
      return NextResponse.json(
        { error: 'Name and projectId are required' },
        { status: 400 }
      );
    }
    
    // Create a new avatar object
    const now = new Date().toISOString();
    const newAvatar: GithubAvatar = {
      id: uuidv4(),
      name: avatarData.name,
      projectId: avatarData.projectId,
      description: avatarData.description || '',
      thumbnailUrl: avatarData.thumbnailUrl || '',
      modelFileUrl: avatarData.modelFileUrl || '',
      polygonCount: avatarData.polygonCount || 0,
      format: avatarData.format || 'VRM',
      materialCount: avatarData.materialCount || 0,
      isPublic: avatarData.isPublic === true,
      isDraft: avatarData.isDraft !== false,
      metadata: avatarData.metadata || {},
      createdAt: now,
      updatedAt: now
    };
    
    // Get current avatars and add the new one
    const avatars = await getAvatars();
    avatars.push(newAvatar);
    
    // Save the updated avatars array
    await saveAvatars(avatars);
    
    return NextResponse.json(newAvatar, { status: 201 });
  } catch (error) {
    console.error('Error creating avatar:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create avatar',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}