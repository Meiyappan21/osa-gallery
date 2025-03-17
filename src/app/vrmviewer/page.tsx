'use client';

import dynamic from 'next/dynamic';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { AvatarHeader } from '@/components/avatar/AvatarHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Laptop2, Info, FileSearch, Settings, Boxes } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Dynamically import the VRMInspector component with no SSR
// This is necessary because the component uses browser-only APIs
const VRMInspector = dynamic(
  () => import('@/components/VRMViewer/VRMInspector'),
  { ssr: false }
);

export default function VRMViewerPage() {
  const isMobile = useIsMobile();
  const { t } = useI18n();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <AvatarHeader 
          title={t('vrmviewer.mobile.intro.title') as string}
          description={t('vrmviewer.description') as string}
          socialLink="https://twitter.com/ToxSam"
          showWarningButton={true}
        />

        <main className="flex-1 py-8 px-4">
          <Card>
            <CardContent className="p-6 space-y-8">
              {/* Desktop Only Banner */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <Laptop2 className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-yellow-800 mb-1">
                    {t('vrmviewer.mobile.desktopOnly.title')}
                  </h2>
                  <p className="text-sm text-yellow-700">
                    {t('vrmviewer.mobile.desktopOnly.description')}
                  </p>
                </div>
              </div>

              {/* Tool Description */}
              <div>
                <h1 className="text-2xl font-bold mb-4">{t('vrmviewer.mobile.intro.title')}</h1>
                <p className="text-gray-600 mb-6">
                  {t('vrmviewer.mobile.intro.description')}
                </p>
              </div>

              {/* Key Features */}
              <div>
                <h2 className="text-lg font-semibold mb-4">{t('vrmviewer.mobile.features.title')}</h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <FileSearch className="h-5 w-5 text-gray-700 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('vrmviewer.mobile.features.modelInfo.title')}</h3>
                      <p className="text-sm text-gray-600">{t('vrmviewer.mobile.features.modelInfo.description')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Settings className="h-5 w-5 text-gray-700 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('vrmviewer.mobile.features.expressionControl.title')}</h3>
                      <p className="text-sm text-gray-600">{t('vrmviewer.mobile.features.expressionControl.description')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Boxes className="h-5 w-5 text-gray-700 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('vrmviewer.mobile.features.textureAnalysis.title')}</h3>
                      <p className="text-sm text-gray-600">{t('vrmviewer.mobile.features.textureAnalysis.description')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {t('vrmviewer.mobile.comingSoon.title')}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('vrmviewer.mobile.comingSoon.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return <VRMInspector />;
} 