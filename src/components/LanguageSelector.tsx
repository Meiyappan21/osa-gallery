'use client';

import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type Locale = 'en' | 'ja';

const languages: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

export function LanguageSelector() {
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    // Update the locale in our i18n context
    setLocale(newLocale);
    
    // Get the current path segments
    const segments = pathname.split('/').filter(Boolean);
    
    // Remove the current locale from the path if it exists
    const pathWithoutLocale = segments.length > 0 && ['en', 'ja'].includes(segments[0])
      ? '/' + segments.slice(1).join('/')
      : pathname;
    
    // Create the new path with the new locale
    const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    window.location.href = newPath;
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="inline-flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 min-w-[120px]">
        <span>Loading...</span>
        <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value as Locale)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        {Object.entries(languages).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
} 