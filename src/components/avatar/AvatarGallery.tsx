///src/components/avatar/AvatarGallery.tsx

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Dice6 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAvatarSelection } from '@/lib/hooks/useAvatarSelection';
import { Avatar, ViewerConfig, ApiResponse } from '@/types/avatar';
import { AvatarCard } from './AvatarCard';
import { AvatarViewer } from './AvatarViewer';
import { AvatarHeader } from './AvatarHeader';
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from '@/lib/i18n';

// Utility function to format camelCase or PascalCase names with spaces
const formatName = (name: string): string => {
  // Add a space before each capital letter that is not at the start
  return name.replace(/([A-Z])/g, ' $1').trim();
};

export const AvatarGallery: React.FC = () => {
  const { t } = useI18n();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState<Avatar | null>(null);
  const [vrmMetadata, setVrmMetadata] = useState<Record<string, any> | null>(null);
  const { 
    selectedAvatars, 
    selectedFormat,
    handleAvatarSelect, 
    handleDownloadSelected,
    clearSelection,
    handleFormatChange
  } = useAvatarSelection();

  const [viewerConfig] = useState<ViewerConfig>({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    expression: 'neutral'
  });

  useEffect(() => {
    // Prevent scrolling on the body when this component is mounted
    document.body.style.overflow = 'hidden';
    
    const fetchAvatars = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/avatars', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch avatars');
        }

        setAvatars(data.avatars);
        if (data.avatars && data.avatars.length > 0) {
          // Select a random avatar instead of the first one
          const randomIndex = Math.floor(Math.random() * data.avatars.length);
          setCurrentAvatar(data.avatars[randomIndex]);
          console.log(`Selected random avatar: ${data.avatars[randomIndex].name}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch avatars');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatars();

    return () => {
      // Restore scrolling when component unmounts
      document.body.style.overflow = '';
    };
  }, []);

  const filteredAvatars = avatars.filter(avatar =>
    avatar.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMetadataLoad = useCallback((metadata: Record<string, any>) => {
    console.log('VRM metadata loaded:', metadata);
    setVrmMetadata(metadata);
  }, []);

  const selectRandomAvatar = useCallback(() => {
    if (filteredAvatars.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredAvatars.length);
      const randomAvatar = filteredAvatars[randomIndex];
      setCurrentAvatar(randomAvatar);
    }
  }, [filteredAvatars]);

  const handleDownloadCurrent = useCallback(() => {
    if (currentAvatar) {
      // Directly open the download URL for the current avatar
      const format = selectedFormat || null;
      const formatParam = format ? `?format=${format}` : '';
      const directDownloadUrl = `/api/avatars/${currentAvatar.id}/direct-download${formatParam}`;
      
      // Open the download in a new tab
      window.open(directDownloadUrl, '_blank');
    }
  }, [currentAvatar, selectedFormat]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Welcome to the home of truly free avatars.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg text-red-500">Error: {error}</div>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!avatars.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg text-gray-500">No avatars found</div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen w-screen max-w-screen overflow-hidden bg-white flex flex-col">
      <div className="flex-none">
        <AvatarHeader 
          title="Open Source Avatars"
          description="A collection of CC0 and open source avatars created by ToxSam"
          socialLink="https://twitter.com/ToxSam"
        />
      </div>
  
      <div className="flex flex-1 overflow-hidden">
        {/* Avatar List - Left Side - Balanced design */}
        <div className="w-1/6 border-r border-gray-200 overflow-hidden flex flex-col bg-gray-50">
          <div className="p-3 flex-none space-y-3 border-b border-gray-200">
            {/* Search and Random Button Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder={t('avatar.controls.search') as string}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-sm"
                />
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button 
                onClick={selectRandomAvatar} 
                variant="ghost" 
                size="sm"
                className="flex-none h-9 w-9 border border-gray-200 rounded-md hover:bg-gray-100"
                title="Select a random avatar"
              >
                <Dice6 className="h-5 w-5 text-gray-700" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Select all filtered avatars
                  filteredAvatars.forEach(avatar => {
                    handleAvatarSelect(avatar.id);
                  });
                }}
                className="flex-1 h-9 text-sm font-normal"
                size="sm"
              >
                {t('avatar.controls.selectAll')}
              </Button>
              <Button
                variant="outline"
                onClick={clearSelection}
                className="flex-1 h-9 text-sm font-normal"
                size="sm"
              >
                {t('avatar.controls.deselectAll')}
              </Button>
            </div>

            {selectedAvatars.size > 0 && (
              <Button
                onClick={() => handleDownloadSelected()}
                className="w-full h-12 text-base font-normal bg-black text-white hover:bg-gray-800 flex items-center justify-center"
              >
                <div className="flex items-center justify-center">
                  <Download className="h-5 w-5 mr-2" />
                  <span>Download ({selectedAvatars.size})</span>
                </div>
              </Button>
            )}
          </div>

          {/* Avatar List with scroll - balanced design */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
            <div className="space-y-2 px-3">
              {filteredAvatars.map(avatar => (
                <div 
                  key={avatar.id}
                  className={`
                    flex items-center p-2 rounded-md cursor-pointer gap-3 
                    ${currentAvatar?.id === avatar.id ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-100'}
                  `}
                  onClick={() => setCurrentAvatar(avatar)}
                >
                  <div onClick={(e) => { e.stopPropagation(); handleAvatarSelect(avatar.id); }}>
                    <Checkbox
                      checked={selectedAvatars.has(avatar.id)}
                      onChange={() => handleAvatarSelect(avatar.id)}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="h-10 w-10 flex-shrink-0">
                    <img
                      src={avatar.thumbnailUrl || '/placeholder.png'}
                      alt={formatName(avatar.name)}
                      className="rounded object-cover w-full h-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {formatName(avatar.name)}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{avatar.project}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Viewer - Right Side */}
        <div className="w-5/6 relative overflow-hidden">
          {currentAvatar ? (
            <>
              {/* Enhanced VRM Metadata Panel - Using extracted VRM metadata */}
              <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-5 rounded-lg shadow-sm max-w-xs overflow-auto max-h-[calc(100vh-120px)]">
                <h2 className="text-xl font-semibold border-b pb-2 mb-2">{currentAvatar && formatName(currentAvatar.name)}</h2>
                
                {/* Thumbnail Image - Added larger version */}
                <div className="my-3 w-full flex justify-center">
                  <img
                    src={currentAvatar.thumbnailUrl || '/placeholder.png'}
                    alt={formatName(currentAvatar.name)}
                    className="rounded-lg object-contain max-w-full max-h-60 shadow-sm border border-gray-200"
                  />
                </div>
                
                {currentAvatar.description && (
                  <p className="text-sm text-gray-600 mb-3">{currentAvatar.description}</p>
                )}
                
                <div className="space-y-1.5 text-sm">
                  {/* Technical Details - Using extracted VRM metadata */}
                  <div className="font-medium">{t('avatar.details.title')}</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <span className="text-gray-500">{t('avatar.details.format')}:</span>
                    <span>{vrmMetadata?.format || currentAvatar.format}</span>
                    
                    <span className="text-gray-500">{t('avatar.details.polygons')}:</span>
                    <span>{vrmMetadata?.triangleCount ? vrmMetadata.triangleCount.toLocaleString() : "Unknown"}</span>
                    
                    <span className="text-gray-500">{t('avatar.details.materials')}:</span>
                    <span>{vrmMetadata?.materialCount ?? "Unknown"}</span>
                  </div>
                  
                  {/* License Information */}
                  <div className="font-medium mt-3">{t('avatar.details.license')}</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <span className="text-gray-500">{t('avatar.details.project')}:</span>
                    <span>{currentAvatar.project}</span>
                    
                    <span className="text-gray-500">{t('avatar.details.license')}:</span>
                    <span>{vrmMetadata?.license || vrmMetadata?.licenseType || "CC0 (Assumed)"}</span>
                    
                    {vrmMetadata?.author && (
                      <>
                        <span className="text-gray-500">{t('avatar.details.author')}:</span>
                        <span>{vrmMetadata.author}</span>
                      </>
                    )}
                  </div>
                  
                  {/* VRM Specific Metadata */}
                  {vrmMetadata && (
                    <>
                      <div className="font-medium mt-3">{t('avatar.vrm.title')}</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        {vrmMetadata.vrmVersion && (
                          <>
                            <span className="text-gray-500">{t('avatar.vrm.version')}:</span>
                            <span>{vrmMetadata.vrmVersion}</span>
                          </>
                        )}
                        
                        {vrmMetadata.allowedUserName && (
                          <>
                            <span className="text-gray-500">{t('avatar.vrm.allowedUsers')}:</span>
                            <span>
                              {vrmMetadata.allowedUserName === 'Everyone' 
                                ? t('avatar.vrm.everyone')
                                : vrmMetadata.allowedUserName}
                            </span>
                          </>
                        )}
                        
                        {vrmMetadata.violentUssage !== undefined && (
                          <>
                            <span className="text-gray-500">Violent Usage:</span>
                            <span>{vrmMetadata.violentUssage ? "Allowed" : "Not Allowed"}</span>
                          </>
                        )}
                        
                        {vrmMetadata.sexualUssage !== undefined && (
                          <>
                            <span className="text-gray-500">Sexual Usage:</span>
                            <span>{vrmMetadata.sexualUssage ? "Allowed" : "Not Allowed"}</span>
                          </>
                        )}
                        
                        {vrmMetadata.commercialUssage !== undefined && (
                          <>
                            <span className="text-gray-500">Commercial:</span>
                            <span>{vrmMetadata.commercialUssage ? "Allowed" : "Not Allowed"}</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Download Button */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <Button 
                  onClick={handleDownloadCurrent}
                  variant="default"
                  className="bg-white text-black hover:bg-gray-100 px-6 py-2 rounded-md flex items-center gap-2 shadow-md border border-gray-200 font-medium"
                  style={{ backdropFilter: 'blur(4px)' }}
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {t('avatar.controls.download')}
                    {selectedFormat && (
                      <>
                        {' ('}
                        {selectedFormat === 'voxel' && t('avatar.formats.vrmViewer')}
                        {selectedFormat === 'fbx' && t('avatar.formats.fbx')}
                        {selectedFormat === 'voxel-fbx' && t('avatar.formats.fbxViewer')}
                        {!['voxel', 'fbx', 'voxel-fbx'].includes(selectedFormat) && selectedFormat.toUpperCase()}
                        {')'}
                      </>
                    )}
                  </span>
                </Button>
              </div>
              
              {/* Full-size Viewer */}
              <div className="w-full h-full">
                <AvatarViewer
                  avatar={currentAvatar}
                  config={viewerConfig}
                  onMetadataLoad={handleMetadataLoad}
                  onFormatSelect={handleFormatChange}
                  selectedFormat={selectedFormat}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <p className="text-gray-500">Select an avatar to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarGallery;
