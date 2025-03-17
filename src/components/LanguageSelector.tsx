'use client';

import { useI18n, locales } from '@/lib/i18n';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const languageNames = {
  en: 'English',
  ja: '日本語'
};

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 min-w-[120px] transition-colors"
      >
        <span>{languageNames[locale]}</span>
        <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                locale === loc ? 'font-medium' : 'font-normal'
              }`}
            >
              {languageNames[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 