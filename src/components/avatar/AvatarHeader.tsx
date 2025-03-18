///src/components/avatar/AvatarHeader.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { AvatarHeaderProps } from '@/types/avatar';
import { Eye, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageSelector } from '@/components/LanguageSelector';
import { usePathname } from 'next/navigation';
import { MobileMenu } from '@/components/ui/mobile-menu';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

export const AvatarHeader: React.FC<AvatarHeaderProps> = ({
  socialLink,
  showWarningButton = false
}) => {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const isVRMInspector = pathname === '/vrminspector';
  const isMobile = useIsMobile();
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Handle header collapse on scroll
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeaderCollapsed(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]);

  // Navigation links to be reused
  const navigationLinks = (
    <>
      <Link 
        href={`/${locale}/gallery`}
        className="text-gray-600 hover:text-gray-900 transition-colors text-sm block md:inline py-3 md:py-0"
      >
        {t('header.navigation.avatars')}
      </Link>
      <Link 
        href={`/${locale}/vrminspector`}
        className="text-gray-600 hover:text-gray-900 transition-colors text-sm block md:inline py-3 md:py-0"
      >
        {t('header.navigation.viewer')}
      </Link>
      <Link 
        href={`/${locale}/resources`}
        className="text-gray-600 hover:text-gray-900 transition-colors text-sm block md:inline py-3 md:py-0"
      >
        {t('header.navigation.resources')}
      </Link>
      <Link 
        href={`/${locale}/about`}
        className="text-gray-600 hover:text-gray-900 transition-colors text-sm block md:inline py-3 md:py-0"
      >
        {t('header.navigation.about')}
      </Link>
    </>
  );

  // Social links to be reused
  const socialLinks = (
    <>
      <a 
        href="https://toxsam.com"
        target="_blank" 
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="ToxSam website"
      >
        <Eye className="h-5 w-5" />
      </a>
      <a 
        href="https://github.com/ToxSam"
        target="_blank" 
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="GitHub profile"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </a>
      <a 
        href={socialLink}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="X/Twitter profile"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
          <path d="M16.99 0h2.87l-6.27 7.17L21 18.66h-6.32l-4.63-6.04-5.28 6.04H1.9l6.71-7.67L1.6 0h6.48l4.18 5.5L16.99 0zm-1.04 16.78h1.6L7.08 1.82h-1.7l10.57 14.96z" />
        </svg>
      </a>
    </>
  );

  return (
    <header className={`w-full bg-white border-b flex-none sticky top-0 z-40 transition-all duration-300 ${isHeaderCollapsed ? 'shadow-md' : ''}`}>
      <div className="w-full px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
          {/* Title and Description - Left aligned */}
          <div className="flex items-center justify-between">
            <Link href={`/${locale}`} className="hover:opacity-80 transition-opacity">
              <h1 className={`text-xl md:text-2xl font-bold text-gray-900 text-left ${isHeaderCollapsed && isMobile ? 'text-lg' : ''}`}>
                Open Source Avatars
              </h1>
              {/* Hide subtitle on mobile when collapsed */}
              {(!isMobile || !isHeaderCollapsed) && (
                <p className="text-sm text-gray-600 text-left hidden md:block">
                  The home of truly free avatars and tools! Enjoy!
                </p>
              )}
            </Link>
            
            {/* Mobile Menu Button - Only on mobile */}
            {isMobile && (
              <MobileMenu>
                <div className="flex flex-col space-y-2">
                  <div className="border-b pb-4 mb-2">
                    {navigationLinks}
                  </div>
                  
                  {isVRMInspector && (
                    <div className="mb-4">
                      <a 
                        href="https://x.com/toxsam"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-800 text-sm font-medium rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors w-full"
                      >
                        <span>{t('header.notification.newFeature')}</span>
                        <span>-</span>
                        <span>{t('header.notification.reportIssues')}</span>
                      </a>
                    </div>
                  )}
                  
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Language</span>
                      <LanguageSelector />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Social Links</p>
                      <div className="flex gap-6">
                        {socialLinks}
                      </div>
                    </div>
                  </div>
                </div>
              </MobileMenu>
            )}
          </div>
          
          {/* Navigation Links - Centered - Hidden on mobile */}
          {!isMobile && (
            <div className="flex justify-center mb-3 md:mb-0">
              <div className="flex gap-8">
                {navigationLinks}
              </div>
            </div>
          )}
          
          {/* Social Links, Language Selector - Hidden on mobile */}
          {!isMobile && (
            <div className="flex justify-center md:justify-end gap-4 flex-shrink-0 items-center">
              <div className="flex items-center gap-4">
                {isVRMInspector && (
                  <a 
                    href="https://x.com/toxsam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-800 text-sm font-medium rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
                  >
                    <span>{t('header.notification.newFeature')}</span>
                    <span>-</span>
                    <span>{t('header.notification.reportIssues')}</span>
                  </a>
                )}
                <LanguageSelector />
              </div>
              {socialLinks}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
