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
import { useIsMobile } from '@/lib/hooks/useIsMobile';

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
  const isMobile = useIsMobile();
  const [showAvatarsList, setShowAvatarsList] = useState(true);
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
          socialLink="https://x.com/toxsam"
        />
      </div>
  
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Avatar List - Left Side on desktop only */}
        {!isMobile && (
          <div className="w-1/6 border-r border-gray-200 overflow-hidden flex flex-col bg-gray-50">
            {/* Search and Controls Container */}
            <div className="p-3 flex-none border-b border-gray-200 space-y-3">
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
              
              {/* Selection Controls */}
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

              {/* Bulk Download Button */}
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

            {/* Avatar List - Vertical scroll */}
            <div className="flex-1 py-2 overflow-y-auto">
              <div className="space-y-2 px-3">
                {filteredAvatars.map(avatar => (
                  <div 
                    key={avatar.id}
                    className={`
                      w-full flex items-center p-2 rounded-md cursor-pointer gap-1
                      ${currentAvatar?.id === avatar.id ? 
                        'bg-blue-50 border-l-2 border-blue-500' : 
                        'hover:bg-gray-100'
                      }
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
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {formatName(avatar.name)}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{avatar.project}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3D Viewer - Full width on mobile, 5/6 on desktop */}
        <div className={`${isMobile ? 'w-full h-full' : 'w-5/6'} relative overflow-hidden`}>
          {currentAvatar ? (
            <>
              {/* We're removing the Metadata Panel from here, as it will be conditionally rendered
                  inside the AvatarViewer component */}
              
              {/* Download Button - Different position on mobile */}
              {!isMobile && (
                <div 
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
                >
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
              )}
              
              {/* Full-size Viewer */}
              <div className="w-full h-full">
                <AvatarViewer
                  avatar={currentAvatar}
                  config={viewerConfig}
                  onMetadataLoad={handleMetadataLoad}
                  onFormatSelect={handleFormatChange}
                  selectedFormat={selectedFormat}
                  onDownload={handleDownloadCurrent}
                  metadata={vrmMetadata}
                  avatars={filteredAvatars}
                  onAvatarSelect={setCurrentAvatar}
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
