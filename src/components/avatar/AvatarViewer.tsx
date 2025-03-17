/// src/components/avatar/AvatarViewer.tsx

import React, { useMemo } from 'react';
import { AvatarViewerProps } from '@/types/avatar';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const VRMViewer = dynamic(() => import('@/components/VRMViewer/VRMViewer').then(mod => mod.VRMViewer), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Loading viewer...</p>
    </div>
  )
});

const DEFAULT_ANIMATION = 'https://assets.opensourceavatars.com/animations/Warrior%20Idle.fbx';
const DEFAULT_ENVIRONMENT = 'https://assets.opensourceavatars.com/environments/cubeScene7.glb';

// Helper function to check available formats from metadata
const getAvailableFormats = (avatar: AvatarViewerProps['avatar']) => {
  const formats: { id: string | null, label: string, isVoxel: boolean }[] = [];
  
  // Check metadata for alternate models
  if (avatar.metadata?.alternateModels) {
    const alternateModels = avatar.metadata.alternateModels;
    
    // Log model information for debugging
    console.log('Avatar name:', avatar.name);
    console.log('Alternate models structure:', JSON.stringify(alternateModels, null, 2));
    
    // Find all keys that might be relevant
    const allKeys = Object.keys(alternateModels);
    console.log('Available keys:', allKeys);
    
    // Standard format detection for all models
    
    // Always add the default VRM format
    formats.push({ id: null, label: 'VRM', isVoxel: false });
    
    // Check for FBX (standard model)
    if (allKeys.includes('fbx') && alternateModels['fbx']) {
      console.log(`Found FBX model with key: fbx`);
      formats.push({ id: 'fbx', label: 'FBX', isVoxel: false });
    }
    
    // Check for Voxel VRM
    if (allKeys.includes('voxel_vrm') && alternateModels['voxel_vrm']) {
      console.log(`Found Voxel VRM with key: voxel_vrm`);
      formats.push({ id: 'voxel', label: 'Voxel VRM', isVoxel: true });
    }
    
    // Check for Voxel FBX
    if ((allKeys.includes('voxel_fbx') && alternateModels['voxel_fbx']) || 
        (allKeys.includes('voxel-fbx') && alternateModels['voxel-fbx'])) {
      console.log(`Found Voxel FBX with key: voxel_fbx or voxel-fbx`);
      formats.push({ id: 'voxel-fbx', label: 'Voxel FBX', isVoxel: true });
    }
  } else {
    // Always add the default VRM format if no alternate models
    formats.push({ id: null, label: 'VRM', isVoxel: false });
  }
  
  return formats;
};

// Function to get the model filename for a specific format
const getModelFilenameForFormat = (
  avatar: AvatarViewerProps['avatar'], 
  format: string | null
): string | null => {
  if (!format || !avatar.metadata?.alternateModels) {
    return null;
  }
  
  const alternateModels = avatar.metadata.alternateModels;
  
  // Find the appropriate key based on the format
  if (format === 'fbx') {
    const value = alternateModels['fbx'];
    
    // If it's already an Arweave URL, return it as is
    if (value && typeof value === 'string' && value.includes('arweave.net')) {
      console.log(`Found direct Arweave URL for FBX format: ${value}`);
      return value;
    }
    return value;
  }
  
  if (format === 'voxel') {
    // Look for voxel_vrm key
    const value = alternateModels['voxel_vrm'];
    
    // If it's already an Arweave URL, return it as is
    if (value && typeof value === 'string' && value.includes('arweave.net')) {
      console.log(`Found direct Arweave URL for Voxel VRM format: ${value}`);
      return value;
    }
    return value;
  }
  
  if (format === 'voxel-fbx') {
    const value = alternateModels['voxel_fbx'] || alternateModels['voxel-fbx'];
    
    // If it's already an Arweave URL, return it as is
    if (value && typeof value === 'string' && value.includes('arweave.net')) {
      console.log(`Found direct Arweave URL for Voxel FBX format: ${value}`);
      return value;
    }
    return value;
  }
  
  return null;
};

export const AvatarViewer: React.FC<AvatarViewerProps> = ({ 
  avatar,
  config,
  onDownload,
  onFormatSelect,
  selectedFormat,
  onMetadataLoad
}) => {
  const { t } = useI18n();
  
  // Log full avatar data when component renders
  console.log(`Rendering AvatarViewer for ${avatar.name} (ID: ${avatar.id})`);
  console.log('Full avatar data:', JSON.stringify(avatar, null, 2));
  console.log('Model file URL:', avatar.modelFileUrl);
  console.log('Selected format:', selectedFormat);

  if (!avatar.modelFileUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No model file available for preview</p>
      </div>
    );
  }
  
  const availableFormats = getAvailableFormats(avatar);
  const hasAlternateFormats = availableFormats.length > 1;

  // Determine which model URL to display in the viewer
  const displayModelUrl = useMemo(() => {
    // Safety check - if no model URL, return early
    if (!avatar.modelFileUrl) return '';
    
    // Get the selected format details
    const selectedFormatDetails = availableFormats.find(f => f.id === selectedFormat);
    console.log('Selected format details:', selectedFormatDetails);
    
    // If voxel format is selected, try to use the voxel VRM for display
    if (selectedFormatDetails?.isVoxel) {
      // Get the filename using our helper function
      const voxelFilename = getModelFilenameForFormat(avatar, 'voxel');
      console.log('Voxel filename for display:', voxelFilename);
      
      // If we have a filename for the voxel VRM
      if (voxelFilename && typeof voxelFilename === 'string') {
        // If it's already an Arweave URL, use it directly
        if (voxelFilename.includes('arweave.net')) {
          console.log('Direct Arweave URL found for voxel, using it:', voxelFilename);
          return voxelFilename;
        }
        
        // Otherwise use our special protocol to signal that this needs to be resolved
        console.log('Using voxel:// protocol with filename:', voxelFilename);
        return `voxel://${voxelFilename}`;
      } else {
        console.log('No voxel filename found, using default modelFileUrl');
      }
    }
    
    // Otherwise use the default VRM
    return avatar.modelFileUrl;
  }, [avatar, selectedFormat, availableFormats]);

  return (
    <div className="w-full h-full relative">
      <VRMViewer
        url={displayModelUrl}
        animationUrl={DEFAULT_ANIMATION}
        backgroundGLB={null}
        onMetadataLoad={onMetadataLoad}
      />
      
      {/* Format selection buttons */}
      {hasAlternateFormats && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white rounded-md p-2 flex items-center space-x-2 border border-gray-200 shadow-md" style={{ backdropFilter: 'blur(4px)' }}>
            <span className="text-black text-sm font-medium mr-2">{t('avatar.details.format')}:</span>
            {availableFormats.map((format) => (
              <Button
                key={format.id || 'default'}
                variant={selectedFormat === format.id ? "default" : "outline"}
                size="sm"
                onClick={() => onFormatSelect && onFormatSelect(format.id)}
                className={selectedFormat === format.id 
                  ? "bg-black text-white font-medium" 
                  : "bg-white text-black border-gray-200 hover:bg-gray-100"}
              >
                {t(`avatar.formats.${format.id || 'vrm'}`)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};