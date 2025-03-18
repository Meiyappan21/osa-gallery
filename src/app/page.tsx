// src/app/page.tsx
'use client';

import React from "react";
import { AvatarHeader } from '@/components/avatar/AvatarHeader';
import { HomeVRMViewer } from '@/components/VRMViewer/HomeVRMViewer';
import { useI18n } from '@/lib/i18n';
import { Download, Palette, Search, Code, Box, GitBranch, Boxes, Microscope, ArrowRight } from "lucide-react";

export default function Home() {
  const { t } = useI18n();
  
  const title = String(t('home.title'));
  const description = String(t('home.description'));

  return (
    <main className="min-h-screen bg-white">
      <AvatarHeader 
        title={title} 
        description={description}
        socialLink="https://x.com/toxsam"
      />
      
      {/* Hero Section with Large Avatar Display */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 pt-12 pb-24">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 max-w-2xl">
              <h1 className="text-6xl font-bold mb-8 leading-tight">
                {t('home.hero.title')} {t('home.hero.tagline')}
              </h1>
              <p className="text-2xl text-gray-600 mb-8 leading-relaxed">
                {t('home.hero.description')}
              </p>
              <div className="flex gap-6">
                <a
                  href="/gallery"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  {t('home.hero.exploreButton')} <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <a
                  href="/vrminspector"
                  className="inline-flex items-center px-8 py-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-lg font-medium"
                >
                  {t('home.hero.viewerButton')}
                </a>
              </div>
            </div>
            <div className="flex-1 w-full lg:w-auto">
              <HomeVRMViewer 
                className="w-full aspect-square max-w-2xl mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-blue-100"></div>
              <span className="text-blue-600 font-medium">{t('home.about.section_title')}</span>
              <div className="h-px flex-1 bg-blue-100"></div>
            </div>
            
            <h2 className="text-4xl font-bold mb-8 text-center">{t('home.about.title')}</h2>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-600 leading-relaxed mb-16">
                {t('home.about.description')}
              </p>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('home.about.github_description')} <a href="https://github.com/toxsam/open-source-avatars" className="text-blue-600 hover:text-blue-700">{t('home.about.github_link')}</a> {t('home.about.github_description_2')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools and Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-blue-100"></div>
              <span className="text-blue-600 font-medium">{t('home.features.section_title')}</span>
              <div className="h-px flex-1 bg-blue-100"></div>
            </div>

            <h2 className="text-4xl font-bold mb-16 text-center">{t('home.features.title')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl">
                <div className="flex items-start gap-6">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">{t('home.features.browse.title')}</h3>
                    <div className="prose prose-lg">
                      <p>{t('home.features.browse.description')}</p>
                      <ul>
                        <li>{t('home.features.browse.bulletPoints.preview')}</li>
                        <li>{t('home.features.browse.bulletPoints.filter')}</li>
                        <li>{t('home.features.browse.bulletPoints.download')}</li>
                        <li>{t('home.features.browse.bulletPoints.updates')}</li>
                      </ul>
                      <a href="/gallery" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium no-underline">
                        {t('home.features.browse.cta')} <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl">
                <div className="flex items-start gap-6">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <Microscope className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">{t('home.features.inspector.title')}</h3>
                    <div className="prose prose-lg">
                      <p>{t('home.features.inspector.description')}</p>
                      <ul>
                        <li>{t('home.features.inspector.bulletPoints.metadata')}</li>
                        <li>{t('home.features.inspector.bulletPoints.expressions')}</li>
                        <li>{t('home.features.inspector.bulletPoints.materials')}</li>
                        <li>{t('home.features.inspector.bulletPoints.validation')}</li>
                      </ul>
                      <a href="/vrminspector" className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium no-underline">
                        {t('home.features.inspector.cta')} <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Deep Dive */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-blue-100"></div>
              <span className="text-blue-600 font-medium">{t('home.technical.section_title')}</span>
              <div className="h-px flex-1 bg-blue-100"></div>
            </div>

            <h2 className="text-4xl font-bold mb-12 text-center">{t('home.technical.title')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Box className="h-8 w-8 text-blue-600" />
                  {t('home.technical.vrm_title')}
                </h3>
                <div className="prose prose-lg">
                  <p>{t('home.technical.vrm_description')}</p>
                  <p className="font-medium mt-6 mb-4">{t('home.technical.key_features')}</p>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <p className="mb-4">{t('home.technical.features_intro')}</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{t('home.technical.vrm_features.skeleton')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{t('home.technical.vrm_features.materials')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{t('home.technical.vrm_features.expressions')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{t('home.technical.vrm_features.eye_movement')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{t('home.technical.vrm_features.vr')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <GitBranch className="h-8 w-8 text-green-600" />
                  {t('home.technical.compatibility_title')}
                </h3>
                <div className="prose prose-lg">
                  <p>{t('home.technical.compatibility_description')}</p>
                  <div className="bg-white rounded-xl p-6 shadow-sm mt-4">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>{t('home.technical.compatibility_items.threejs')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>{t('home.technical.compatibility_items.vrchat')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>{t('home.technical.compatibility_items.engines')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>{t('home.technical.compatibility_items.webgl')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>{t('home.technical.compatibility_items.webxr')}</span>
                      </li>
                    </ul>
                    <a href="https://vrm.dev" 
                       className="inline-flex items-center mt-6 text-green-600 hover:text-green-700 font-medium no-underline">
                      {t('home.technical.learn_more')} <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-blue-100"></div>
              <span className="text-blue-600 font-medium">{t('home.applications.section_title')}</span>
              <div className="h-px flex-1 bg-blue-100"></div>
            </div>

            <h2 className="text-4xl font-bold mb-16 text-center">{t('home.applications.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
              <div>
                <Code className="h-10 w-10 text-purple-600 mb-6" />
                <h3 className="text-2xl font-bold mb-4">{t('home.applications.web.title')}</h3>
                <div className="prose prose-lg">
                  <p>{t('home.applications.web.description')}</p>
                </div>
              </div>

              <div>
                <Boxes className="h-10 w-10 text-blue-600 mb-6" />
                <h3 className="text-2xl font-bold mb-4">{t('home.applications.vr.title')}</h3>
                <div className="prose prose-lg">
                  <p>{t('home.applications.vr.description')}</p>
                </div>
              </div>

              <div>
                <Palette className="h-10 w-10 text-orange-600 mb-6" />
                <h3 className="text-2xl font-bold mb-4">{t('home.applications.creative.title')}</h3>
                <div className="prose prose-lg">
                  <p>{t('home.applications.creative.description')}</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-lg text-gray-600 mb-6">
                {t('home.applications.showcase_description')}
              </p>
              <a 
                href="https://vrm.dev/en/showcase/" 
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('home.applications.showcase_link')} <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">{t('home.cta.title')}</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              {t('home.cta.description')}
            </p>
            <div className="flex gap-6 justify-center">
              <a
                href="/gallery"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                {t('home.hero.exploreButton')} <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/resources"
                className="inline-flex items-center px-8 py-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-lg font-medium"
              >
                {t('home.cta.documentation')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600">
        <p>
          {t('home.footer.made_with')} <a href="https://twitter.com/toxsam" className="text-blue-600 hover:text-blue-700">ToxSam</a>
        </p>
      </footer>
    </main>
  );
}