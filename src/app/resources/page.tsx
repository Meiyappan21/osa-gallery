'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Database } from "lucide-react";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { useI18n } from "@/lib/i18n";

export default function ResourcesPage() {
  const { t, isLoading } = useI18n();
  
  // Get the goals list with proper type casting
  const goals = t('resources.philosophy.goals.list', { returnObjects: true }) as any;
  const goalsList = Array.isArray(goals) ? goals : [];

  if (isLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AvatarHeader 
        title="Open Source Avatars"
        description="A collection of CC0 and open source avatars created by ToxSam"
        socialLink="https://twitter.com/ToxSam"
      />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="p-6 space-y-8">
              <div>
                <h1 className="text-2xl font-bold mb-8">{t('resources.title')}</h1>
                
                <h2 className="text-xl font-semibold mb-4">{t('resources.batch.title')}</h2>
                <p className="text-gray-600 mb-4">{t('resources.batch.description')}</p>
                
                <Button 
                  asChild
                  variant="outline"
                  className="h-auto py-4 w-full flex items-start justify-start text-left bg-white hover:bg-gray-50 mb-6"
                >
                  <a href="https://app.ardrive.io/#/drives/53bc4d95-d0e0-41b4-a750-7c722f346dd1?name=Open+Source+Avatars+by+ToxSam" target="_blank" rel="noopener noreferrer">
                    <div className="flex">
                      <div className="mr-4">
                        <Database className="h-10 w-10 text-gray-700" />
                      </div>
                      <div>
                        <div className="font-semibold">{t('resources.batch.button.title')}</div>
                        <div className="text-sm text-gray-600 mt-1">{t('resources.batch.button.description')}</div>
                      </div>
                    </div>
                  </a>
                </Button>
                
                <div className="bg-blue-50 p-4 rounded-md mb-8">
                  <h3 className="font-semibold mb-2">{t('resources.ardrive.title')}</h3>
                  <p className="text-sm text-gray-700 mb-3">{t('resources.ardrive.description1')}</p>
                  <p className="text-sm text-gray-700">{t('resources.ardrive.description2')}</p>
                </div>

                <h2 className="text-xl font-semibold mb-4">{t('resources.github.title')}</h2>
                <p className="text-gray-600 mb-4">{t('resources.github.description')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <Button 
                    asChild
                    variant="outline"
                    className="h-auto py-4 flex items-start justify-start text-left bg-white hover:bg-gray-50"
                  >
                    <a href="https://github.com/toxsam/open-source-avatars" target="_blank" rel="noopener noreferrer">
                      <div className="flex">
                        <div className="mr-4">
                          <Github className="h-10 w-10 text-gray-700" />
                        </div>
                        <div>
                          <div className="font-semibold">{t('resources.github.database.title')}</div>
                          <div className="text-sm text-gray-600 mt-1">{t('resources.github.database.description')}</div>
                        </div>
                      </div>
                    </a>
                  </Button>
                  
                  <Button 
                    asChild
                    variant="outline"
                    className="h-auto py-4 flex items-start justify-start text-left bg-white hover:bg-gray-50"
                  >
                    <a href="https://github.com/toxsam/osa-gallery" target="_blank" rel="noopener noreferrer">
                      <div className="flex">
                        <div className="mr-4">
                          <Github className="h-10 w-10 text-gray-700" />
                        </div>
                        <div>
                          <div className="font-semibold">{t('resources.github.website.title')}</div>
                          <div className="text-sm text-gray-600 mt-1">{t('resources.github.website.description')}</div>
                        </div>
                      </div>
                    </a>
                  </Button>
                </div>

                <h2 className="text-xl font-semibold mb-4">{t('resources.vrm.title')}</h2>
                <p className="text-gray-600 mb-4">{t('resources.vrm.description')}</p>
                
                <div className="bg-gray-50 p-4 rounded-md mb-8">
                  <h3 className="font-semibold mb-2">{t('resources.vrm.what.title')}</h3>
                  <p className="text-sm text-gray-700 mb-3">{t('resources.vrm.what.description1')}</p>
                  <p className="text-sm text-gray-700 mb-3">{t('resources.vrm.what.description2')}</p>
                  <p className="text-sm text-gray-700">
                    <a 
                      href="https://vrm.dev/en/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {t('resources.vrm.what.learnMore')}
                    </a>
                  </p>
                </div>

                <h2 className="text-xl font-semibold mb-4">{t('resources.philosophy.title')}</h2>
                <p className="text-gray-600 mb-4">{t('resources.philosophy.description')}</p>
                
                <div className="bg-gray-50 p-4 rounded-md mb-8">
                  <p className="text-sm text-gray-700 mb-3">{t('resources.philosophy.goals.intro')}</p>
                  <ul className="list-disc text-sm text-gray-700 ml-5 mb-3 space-y-1">
                    {goalsList.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-700 mb-3">{t('resources.philosophy.description1')}</p>
                  <p className="text-sm text-gray-700 mb-3">{t('resources.philosophy.description2')}</p>
                  <p className="text-sm text-gray-700">{t('resources.philosophy.description3')}</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">{t('resources.contact.title')}</h2>
                  <p className="text-gray-600 mb-4">{t('resources.contact.description')}</p>
                  <div className="flex gap-2">
                    <Button 
                      asChild
                      className="bg-black hover:bg-gray-800"
                    >
                      <a href="https://x.com/toxsam" target="_blank" rel="noopener noreferrer">
                        {t('resources.contact.button')}
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