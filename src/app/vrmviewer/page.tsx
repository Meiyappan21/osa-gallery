import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamically import the VRMInspector component with no SSR
// This is necessary because the component uses browser-only APIs
const VRMInspector = dynamic(
  () => import('@/components/VRMViewer/VRMInspector'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'VRM Inspector - Open Source Avatars',
  description: 'Inspect and analyze VRM files - view metadata, textures, and 3D models'
};

export default function VRMViewerPage() {
  return <VRMInspector />;
} 