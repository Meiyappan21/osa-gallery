///src/components/avatar/AvatarHeader.tsx

'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { AvatarHeaderProps } from '@/types/avatar';
import { Eye, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageSelector } from '@/components/LanguageSelector';
import { usePathname } from 'next/navigation';

export const AvatarHeader: React.FC<AvatarHeaderProps> = ({
  socialLink,
  showWarningButton = false
}) => {
  const { t } = useI18n();
  const pathname = usePathname();
  const isVRMViewer = pathname === '/vrmviewer';

  return (
    <header className="w-full bg-white border-b flex-none">
      <div className="w-full px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
          {/* Title and Description - Left aligned */}
          <div className="flex-shrink-0 mb-3 md:mb-0">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 text-center md:text-left">
                Open Source Avatars
              </h1>
              <p className="text-sm text-gray-600 text-center md:text-left">
                The home of truly free avatars and tools! Enjoy!
              </p>
            </a>
          </div>
          
          {/* Navigation Links - Centered */}
          <div className="flex justify-center mb-3 md:mb-0">
            <div className="flex gap-8">
              <a 
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                {t('header.navigation.avatars')}
              </a>
              <a 
                href="/about"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                {t('header.navigation.about')}
              </a>
              <a 
                href="/resources"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                {t('header.navigation.resources')}
              </a>
              <a 
                href="/vrmviewer"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                {t('header.navigation.viewer')}
              </a>
            </div>
          </div>
          
          {/* Social Links, Language Selector, and Warning Button - Right aligned */}
          <div className="flex justify-center md:justify-end gap-4 flex-shrink-0 items-center">
            <div className="flex items-center gap-4">
              {isVRMViewer && (
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
            <a 
              href="https://toxsam.com"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Eye className="h-5 w-5" />
            </a>
            <a 
              href="https://github.com/ToxSam"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
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
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path d="M16.99 0h2.87l-6.27 7.17L21 18.66h-6.32l-4.63-6.04-5.28 6.04H1.9l6.71-7.67L1.6 0h6.48l4.18 5.5L16.99 0zm-1.04 16.78h1.6L7.08 1.82h-1.7l10.57 14.96z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
