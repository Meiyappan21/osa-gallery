import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VRM Inspector - Open Source Avatars',
  description: 'Inspect and analyze VRM files - view metadata, textures, and 3D models'
};

export default function VRMViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 