"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Twitter } from "lucide-react";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { useI18n } from '@/lib/i18n';

export default function AboutPage() {
  const { t } = useI18n();

  // Get the lists as arrays with returnObjects option
  const updatesList = t('about.updates.list', { returnObjects: true });
  const futureList = t('about.future.list', { returnObjects: true });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AvatarHeader 
        title="Open Source Avatars"
        description="A collection of CC0 and open source avatars created by ToxSam"
        socialLink="https://x.com/toxsam"
      />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="p-6 space-y-8">
              <div>
                <h1 className="text-2xl font-bold mb-8">{t('about.title')}</h1>
                
                <h2 className="text-xl font-semibold mb-4">{t('about.project.title')}</h2>
                <p className="text-gray-600 mb-8">
                  {t('about.project.description1')}
                </p>
                <p className="text-gray-600 mb-8">
                  {t('about.project.description2')}
                </p>

                <h2 className="text-xl font-semibold mb-4">{t('about.status.title')}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-sm">{t('about.status.badges.beta')}</span>
                  <span className="bg-black text-white px-3 py-1 rounded-full text-sm">{t('about.status.badges.avatars')}</span>
                  <span className="bg-black text-white px-3 py-1 rounded-full text-sm">{t('about.status.badges.format')}</span>
                </div>
                <p className="text-gray-600 mb-8">
                  {t('about.status.description')}
                </p>

                <h2 className="text-xl font-semibold mb-4">{t('about.updates.title')}</h2>
                <div className="bg-green-50 p-4 rounded-md mb-8">
                  <p className="text-sm text-gray-700 mb-3 font-medium">
                    {t('about.updates.intro')}
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {Array.isArray(updatesList) && updatesList.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <h2 className="text-xl font-semibold mb-4">{t('about.development.title')}</h2>
                <p className="text-gray-600 mb-4">
                  {t('about.development.description1')}
                </p>
                <p className="text-gray-600 mb-8">
                  {t('about.development.description2')}
                </p>

                <h2 className="text-xl font-semibold mb-4">{t('about.future.title')}</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 mb-8">
                  {Array.isArray(futureList) && futureList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">{t('about.contact.title')}</h2>
                  <div className="flex gap-2">
                    <Button 
                      asChild
                      className="bg-black hover:bg-gray-800"
                    >
                      <a href="https://twitter.com/toxsam" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        {t('about.contact.twitter')}
                      </a>
                    </Button>
                    <Button 
                      asChild
                      className="bg-black hover:bg-gray-800"
                    >
                      <a href="https://toxsam.com" target="_blank" rel="noopener noreferrer">
                        {t('about.contact.website')}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}