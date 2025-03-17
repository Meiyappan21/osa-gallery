const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.production') });

const prisma = new PrismaClient();

// Validate environment variables
const requiredEnvVars = [
  'DEV_R2_ACCOUNT_ID',
  'DEV_R2_ACCESS_KEY_ID',
  'DEV_R2_SECRET_ACCESS_KEY',
  'DEV_R2_BUCKET_NAME',
  'DEV_R2_PUBLIC_DOMAIN',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_DOMAIN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

// Source (Development) R2 configuration
const sourceClient = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.DEV_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.DEV_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.DEV_R2_SECRET_ACCESS_KEY
  }
});

// Destination (Production) R2 configuration
const destClient = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

async function migrateFiles() {
  try {
    console.log('Starting R2 migration...');

    // List all objects in source bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.DEV_R2_BUCKET_NAME
    });

    const { Contents = [] } = await sourceClient.send(listCommand);
    console.log(`Found ${Contents.length} files to migrate`);

    // Migrate each file
    for (const object of Contents) {
      if (!object.Key) continue;

      console.log(`Migrating ${object.Key}...`);

      try {
        // Get file from source bucket
        const getCommand = new GetObjectCommand({
          Bucket: process.env.DEV_R2_BUCKET_NAME,
          Key: object.Key
        });

        const { Body, ContentType } = await sourceClient.send(getCommand);

        if (!Body) {
          console.log(`Failed to get content for ${object.Key}`);
          continue;
        }

        // Use Upload utility for streaming upload
        const upload = new Upload({
          client: destClient,
          params: {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: object.Key,
            Body: Body,
            ContentType: ContentType
          }
        });

        upload.on('httpUploadProgress', (progress) => {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Upload progress for ${object.Key}: ${percentage}%`);
        });

        await upload.done();
        console.log(`Successfully migrated ${object.Key}`);
      } catch (error) {
        console.error(`Failed to migrate file ${object.Key}:`, error);
        continue; // Continue with next file even if one fails
      }
    }

    // Update database URLs
    console.log('Updating database URLs...');
    await updateDatabaseUrls();

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function updateDatabaseUrls() {
  const oldDomain = process.env.DEV_R2_PUBLIC_DOMAIN;
  const newDomain = process.env.R2_PUBLIC_DOMAIN;

  console.log(`Updating URLs from ${oldDomain} to ${newDomain}`);

  const result = await prisma.avatar.updateMany({
    data: {
      thumbnailUrl: {
        set: {
          _name_: 'regexp_replace',
          args: [{ _name_: 'thumbnailUrl' }, oldDomain, newDomain]
        }
      },
      modelFileUrl: {
        set: {
          _name_: 'regexp_replace',
          args: [{ _name_: 'modelFileUrl' }, oldDomain, newDomain]
        }
      }
    },
    where: {
      OR: [
        { thumbnailUrl: { contains: oldDomain } },
        { modelFileUrl: { contains: oldDomain } }
      ]
    }
  });

  console.log(`Updated ${result.count} records in the database`);
}

// Run migration
migrateFiles()
  .finally(async () => {
    await prisma.$disconnect();
  });