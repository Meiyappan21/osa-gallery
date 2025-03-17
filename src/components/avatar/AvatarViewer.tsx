/// src/components/avatar/AvatarViewer.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { AvatarViewerProps } from '@/types/avatar';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2, Info, Eye, EyeOff, DownloadCloud, X, Menu, Search, Dice6 } from 'lucide-react';
import { setupMobileGestureHelp } from '@/lib/utils';

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

// Add the formatName helper function
const formatName = (name: string): string => {
  // Add a space before each capital letter that is not at the start
  return name.replace(/([A-Z])/g, ' $1').trim();
};

// Update the AvatarViewerProps interface in this file only (temporary fix)
interface ExtendedAvatarViewerProps extends AvatarViewerProps {
  metadata?: Record<string, any> | null;
  onDownload?: (id: string, format?: string | null) => void;
  avatars?: AvatarViewerProps['avatar'][];
  onAvatarSelect?: (avatar: AvatarViewerProps['avatar']) => void;
}

export const AvatarViewer: React.FC<ExtendedAvatarViewerProps> = ({ 
  avatar,
  config,
  onDownload,
  onFormatSelect,
  selectedFormat,
  onMetadataLoad,
  metadata,
  avatars,
  onAvatarSelect
}) => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [showTouchControls, setShowTouchControls] = useState(true);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showAvatarBrowser, setShowAvatarBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize showInfoPanel based on device type
  const [showInfoPanel, setShowInfoPanel] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // Show on desktop, hide on mobile
    }
    return !isMobile; // Fallback
  });
  
  const [wireframeMode, setWireframeMode] = useState(false);
  const [skeletonMode, setSkeletonMode] = useState(false);
  
  // Update showInfoPanel when device type changes
  useEffect(() => {
    setShowInfoPanel(!isMobile);
  }, [isMobile]);

  // Setup mobile gesture help on first render
  useEffect(() => {
    if (isMobile) {
      setupMobileGestureHelp();
    }
  }, [isMobile]);

  // Function to toggle wireframe mode
  const toggleWireframeMode = () => {
    const newMode = !wireframeMode;
    setWireframeMode(newMode);
    console.log("Toggling wireframe mode to:", newMode);
    
    // Dispatch custom event to notify VRMViewer
    window.dispatchEvent(new CustomEvent('toggle-wireframe'));
  };

  // Function to toggle skeleton mode
  const toggleSkeletonMode = () => {
    const newMode = !skeletonMode;
    setSkeletonMode(newMode);
    console.log("Toggling skeleton mode to:", newMode);
    
    // Dispatch custom event to notify VRMViewer
    window.dispatchEvent(new CustomEvent('toggle-skeleton'));
  };
  
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
      
      {/* Mobile Touch Controls */}
      {isMobile && (
        <>
          {/* Main controls expandable */}
          {showTouchControls ? (
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md">
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm"
                  onClick={() => setShowTouchControls(false)}
                  aria-label="Hide controls"
                >
                  <Minimize2 className="h-5 w-5 text-gray-700" />
                </button>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-md flex flex-col items-center gap-2">
                {/* Control buttons */}
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm"
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  aria-label={showInfoPanel ? "Hide info panel" : "Show info panel"}
                >
                  {showInfoPanel ? (
                    <EyeOff className="h-5 w-5 text-gray-700" />
                  ) : (
                    <Info className="h-5 w-5 text-gray-700" />
                  )}
                </button>
                
                <button 
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${
                    wireframeMode ? 'bg-black text-white' : 'bg-white text-gray-700'
                  } border border-gray-200 shadow-sm`}
                  onClick={toggleWireframeMode}
                  aria-label="Toggle wireframe mode"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M3 15h18" />
                    <path d="M9 3v18" />
                    <path d="M15 3v18" />
                  </svg>
                </button>
                
                <button 
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${
                    skeletonMode ? 'bg-black text-white' : 'bg-white text-gray-700'
                  } border border-gray-200 shadow-sm`}
                  onClick={toggleSkeletonMode}
                  aria-label="Toggle skeleton mode"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="7" cy="12" r="3" />
                    <circle cx="17" cy="12" r="3" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </button>
                
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm"
                  onClick={() => {
                    const event = new CustomEvent('reset-camera');
                    window.dispatchEvent(event);
                  }}
                  aria-label="Reset view"
                >
                  <RotateCcw className="h-5 w-5 text-gray-700" />
                </button>
                
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm"
                  onClick={() => {
                    const event = new CustomEvent('zoom-in');
                    window.dispatchEvent(event);
                  }}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5 text-gray-700" />
                </button>
                
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm"
                  onClick={() => {
                    const event = new CustomEvent('zoom-out');
                    window.dispatchEvent(event);
                  }}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-5 w-5 text-gray-700" />
                </button>
                
                {onDownload && (
                  <button 
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm"
                    onClick={() => onDownload(avatar.id, selectedFormat)}
                    aria-label="Download avatar"
                  >
                    <DownloadCloud className="h-5 w-5 text-gray-700" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute top-4 right-4 z-10">
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md"
                onClick={() => setShowTouchControls(true)}
                aria-label="Show controls"
              >
                <Maximize2 className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          )}

          {/* Format picker expandable - Separate menu */}
          {isMobile && hasAlternateFormats && (
            <div className="absolute top-4 right-20 z-10 flex flex-col gap-2">
              {showFormatMenu ? (
                <>
                  <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md">
                    <button 
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm"
                      onClick={() => setShowFormatMenu(false)}
                      aria-label="Hide format menu"
                    >
                      <Minimize2 className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-md flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">{t('avatar.details.format')}</span>
                    <div className="flex flex-col items-center gap-1">
                      {availableFormats.map((format) => (
                        <Button
                          key={format.id || 'default'}
                          variant={selectedFormat === format.id ? "default" : "outline"}
                          size="xs"
                          onClick={() => onFormatSelect && onFormatSelect(format.id)}
                          className={`w-24 text-center ${selectedFormat === format.id 
                            ? "bg-black text-white font-medium" 
                            : "bg-white text-black border-gray-200 hover:bg-gray-100"} text-xs px-2 py-1 h-7`}
                        >
                          {t(`avatar.formats.${format.id || 'vrm'}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md"
                  onClick={() => setShowFormatMenu(true)}
                  aria-label="Show format menu"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-700" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M4 12h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Mobile Avatar Browser */}
      {isMobile && (
        <>
          {/* Random Avatar Button - Floating */}
          {!showAvatarBrowser && (
            <button
              onClick={() => {
                if (avatars?.length) {
                  const randomIndex = Math.floor(Math.random() * avatars.length);
                  onAvatarSelect?.(avatars[randomIndex]);
                }
              }}
              className="absolute bottom-24 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md z-20"
              aria-label="Random avatar"
            >
              <Dice6 className="h-6 w-6 text-gray-700" />
            </button>
          )}

          {/* Avatar Browser */}
          <div className="absolute bottom-0 left-0 right-0 z-20">
            {showAvatarBrowser ? (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                  onClick={() => setShowAvatarBrowser(false)}
                />
                
                {/* Browser Panel */}
                <div className="fixed inset-0 bg-white flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-semibold">{t('avatar.controls.browse')}</h2>
                    <button
                      onClick={() => setShowAvatarBrowser(false)}
                      className="p-2 rounded-full hover:bg-gray-100"
                      aria-label="Close browser"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Search bar */}
                  <div className="p-4 bg-white sticky top-16 z-10">
                    <div className="relative flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="search"
                          placeholder={t('avatar.controls.search') as string}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                      <button
                        onClick={() => setShowAvatarBrowser(false)}
                        className="flex-none w-12 h-12 flex items-center justify-center rounded-lg bg-white border border-gray-200"
                        aria-label="Close browser"
                      >
                        <X className="h-6 w-6 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* Avatar grid */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {avatars
                        ?.filter(a => 
                          a.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((a) => (
                          <button
                            key={a.id}
                            onClick={() => {
                              onAvatarSelect?.(a);
                              setShowAvatarBrowser(false);
                            }}
                            className={`flex flex-col items-center p-2 rounded-lg border ${
                              a.id === avatar.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={a.thumbnailUrl || '/placeholder.png'}
                                alt={a.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="mt-2 text-sm font-medium text-gray-900 truncate w-full text-center">
                              {a.name}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Browse button
              <button
                onClick={() => setShowAvatarBrowser(true)}
                className="w-full bg-black text-white py-4 px-6 flex items-center justify-center space-x-2"
              >
                <Menu className="h-5 w-5" />
                <span>{t('avatar.controls.browse') as string}</span>
              </button>
            )}
          </div>
        </>
      )}
      
      {/* Format selection buttons - desktop only */}
      {!isMobile && hasAlternateFormats && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white rounded-md p-2 flex items-center space-x-2 border border-gray-200 shadow-md" style={{ backdropFilter: 'blur(4px)' }}>
            <span className="text-black text-sm font-medium mr-2">{t('avatar.details.format')}:</span>
            {availableFormats.map((format) => (
              <Button
                key={format.id || 'default'}
                variant={selectedFormat === format.id ? "default" : "outline"}
                size="sm"
                onClick={() => onFormatSelect && onFormatSelect(format.id)}
                className={`${selectedFormat === format.id 
                  ? "bg-black text-white font-medium" 
                  : "bg-white text-black border-gray-200 hover:bg-gray-100"}`}
              >
                {t(`avatar.formats.${format.id || 'vrm'}`)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile instructions indicator */}
      {isMobile && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-70 text-center" 
          style={{ display: 'none' }} // Initially hidden, will be shown by JS on first load
          id="mobile-gesture-help"
        >
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md text-gray-800 text-sm">
            <p className="font-medium">Touch Controls</p>
            <ul className="text-xs mt-2 text-left space-y-1">
              <li>• One finger drag: Rotate model</li>
              <li>• Two finger pinch: Zoom in/out</li>
              <li>• Two finger drag: Pan camera</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Metadata Panel - Conditionally rendered based on showInfoPanel */}
      {showInfoPanel && (
        <div 
          className={`
            ${isMobile ? 
              'absolute bottom-4 left-4 right-4 z-10 max-h-[40vh] overflow-y-auto rounded-lg shadow-lg' : 
              'absolute top-4 left-4 z-10 max-w-xs max-h-[calc(100vh-120px)]'
            } 
            bg-white/95 backdrop-blur-sm p-5 overflow-auto
          `}
        >
          <h2 className="text-xl font-semibold border-b pb-2 mb-2">{avatar && formatName(avatar.name)}</h2>
          
          {/* Thumbnail Image - Responsive styling for both mobile and desktop */}
          <div className={`my-3 w-full flex justify-center ${isMobile ? 'max-h-32' : ''}`}>
            <img
              src={avatar.thumbnailUrl || '/placeholder.png'}
              alt={formatName(avatar.name)}
              className={`rounded-lg object-contain shadow-sm border border-gray-200 ${
                isMobile ? 'max-h-32 w-auto' : 'max-w-full max-h-60'
              }`}
            />
          </div>
          
          {avatar.description && (
            <p className="text-sm text-gray-600 mb-3">{avatar.description}</p>
          )}
          
          <div className="space-y-1.5 text-sm">
            {/* Technical Details Section */}
            <div className="font-medium">{t('avatar.details.title')}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <span className="text-gray-500">{t('avatar.details.format')}:</span>
              <span>{metadata?.format || avatar.format}</span>
              
              <span className="text-gray-500">{t('avatar.details.polygons')}:</span>
              <span>{metadata?.triangleCount ? metadata.triangleCount.toLocaleString() : "Unknown"}</span>
              
              <span className="text-gray-500">{t('avatar.details.materials')}:</span>
              <span>{metadata?.materialCount ?? "Unknown"}</span>
            </div>
            
            {/* License Information */}
            <div className="font-medium mt-3">{t('avatar.details.license')}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <span className="text-gray-500">{t('avatar.details.project')}:</span>
              <span>{avatar.project}</span>
              
              <span className="text-gray-500">{t('avatar.details.license')}:</span>
              <span>{metadata?.license || metadata?.licenseType || "CC0 (Assumed)"}</span>
              
              {metadata?.author && (
                <>
                  <span className="text-gray-500">{t('avatar.details.author')}:</span>
                  <span>{metadata.author}</span>
                </>
              )}
            </div>
            
            {/* VRM Specific Metadata - Collapsible on mobile */}
            {metadata && (
              <>
                <div className="font-medium mt-3">{t('avatar.vrm.title')}</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  {metadata.vrmVersion && (
                    <>
                      <span className="text-gray-500">{t('avatar.vrm.version')}:</span>
                      <span>{metadata.vrmVersion}</span>
                    </>
                  )}
                  
                  {metadata.allowedUserName && (
                    <>
                      <span className="text-gray-500">{t('avatar.vrm.allowedUsers')}:</span>
                      <span>
                        {metadata.allowedUserName === 'Everyone' 
                          ? t('avatar.vrm.everyone')
                          : metadata.allowedUserName}
                      </span>
                    </>
                  )}
                  
                  {metadata.violentUssage !== undefined && (
                    <>
                      <span className="text-gray-500">Violent Usage:</span>
                      <span>{metadata.violentUssage ? "Allowed" : "Not Allowed"}</span>
                    </>
                  )}
                  
                  {metadata.sexualUssage !== undefined && (
                    <>
                      <span className="text-gray-500">Sexual Usage:</span>
                      <span>{metadata.sexualUssage ? "Allowed" : "Not Allowed"}</span>
                    </>
                  )}
                  
                  {metadata.commercialUssage !== undefined && (
                    <>
                      <span className="text-gray-500">Commercial:</span>
                      <span>{metadata.commercialUssage ? "Allowed" : "Not Allowed"}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};