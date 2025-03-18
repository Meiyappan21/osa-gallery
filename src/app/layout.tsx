import './globals.css';
import { I18nProvider } from '@/lib/i18n';

export const metadata = {
  title: 'Open Source Avatars',
  description: 'Free and open source 3D avatars for everyone',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider defaultLocale="en">
      {children}
    </I18nProvider>
  );
}