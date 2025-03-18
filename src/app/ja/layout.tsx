import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { I18nProvider } from '@/lib/i18n';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'オープンソースアバター',
  description: 'オープンソースのVRMとGLBアバターコレクション'
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
});

const fontClasses = `${inter.variable} ${GeistMono.variable} ${notoSansJP.variable}`;

export default function JaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={fontClasses} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <I18nProvider defaultLocale="ja">
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}