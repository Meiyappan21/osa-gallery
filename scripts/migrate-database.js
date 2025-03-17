const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// First clear any existing env vars
for (const key in process.env) {
  if (key.startsWith('DATABASE_')) {
    delete process.env[key];
  }
}

// Load development environment
const devEnv = dotenv.config({ 
  path: path.join(process.cwd(), '.env.development')
}).parsed;

// Store dev URL and clear env
const devUrl = devEnv.DATABASE_URL;
for (const key in process.env) {
  if (key.startsWith('DATABASE_')) {
    delete process.env[key];
  }
}

// Load production environment
const prodEnv = dotenv.config({ 
  path: path.join(process.cwd(), '.env.production')
}).parsed;

const prodUrl = prodEnv.DATABASE_URL;

async function migrateData() {
  console.log('\nStarting migration process...');
  console.log('Development URL:', devUrl?.replace(/:[^@]+@/, ':***@'));
  console.log('Production URL:', prodUrl?.replace(/:[^@]+@/, ':***@'));

  const devPrisma = new PrismaClient({
    datasources: { db: { url: devUrl } }
  });

  const prodPrisma = new PrismaClient({
    datasources: { db: { url: prodUrl } }
  });

  try {
    // Get initial counts
    const devCounts = {
      users: await devPrisma.user.count(),
      projects: await devPrisma.project.count(),
      avatars: await devPrisma.avatar.count(),
      tags: await devPrisma.tag.count(),
      avatarTags: await devPrisma.avatarTag.count(),
      downloads: await devPrisma.download.count()
    };

    console.log('\nSource database counts:', devCounts);

    // Fetch all data
    console.log('\nFetching data from development database...');
    
    const users = await devPrisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    const projects = await devPrisma.project.findMany();
    console.log(`Found ${projects.length} projects`);
    
    const avatars = await devPrisma.avatar.findMany();
    console.log(`Found ${avatars.length} avatars`);
    
    const tags = await devPrisma.tag.findMany();
    console.log(`Found ${tags.length} tags`);

    const avatarTags = await devPrisma.avatarTag.findMany();
    console.log(`Found ${avatarTags.length} avatar tags`);
    
    const downloads = await devPrisma.download.findMany();
    console.log(`Found ${downloads.length} downloads`);

    // Migration function
    const migrateModel = async (data, model, name) => {
      console.log(`\nMigrating ${name}...`);
      let succeeded = 0;
      let failed = 0;
      const errors = [];

      for (const item of data) {
        try {
          await prodPrisma[model].create({
            data: item
          });
          succeeded++;
          if (succeeded % 10 === 0) {
            process.stdout.write(`\rProgress: ${succeeded}/${data.length}`);
          }
        } catch (error) {
          failed++;
          errors.push({ id: item.id, error: error.message });
          console.error(`\nError migrating ${name} ${item.id}:`, error.message);
        }
      }

      console.log(`\n${name} migration complete: ${succeeded} succeeded, ${failed} failed`);
      if (errors.length > 0) {
        console.log('Errors:', errors);
      }
    };

    // Migrate in order
    await migrateModel(users, 'user', 'users');
    await migrateModel(projects, 'project', 'projects');
    await migrateModel(avatars, 'avatar', 'avatars');
    await migrateModel(tags, 'tag', 'tags');
    await migrateModel(avatarTags, 'avatarTag', 'avatar tags');
    await migrateModel(downloads, 'download', 'downloads');

    // Verify counts
    const prodCounts = {
      users: await prodPrisma.user.count(),
      projects: await prodPrisma.project.count(),
      avatars: await prodPrisma.avatar.count(),
      tags: await prodPrisma.tag.count(),
      avatarTags: await prodPrisma.avatarTag.count(),
      downloads: await prodPrisma.download.count()
    };

    console.log('\nMigration verification:');
    for (const key in devCounts) {
      console.log(`${key}: ${devCounts[key]} → ${prodCounts[key]}`);
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await devPrisma.$disconnect();
    await prodPrisma.$disconnect();
  }
}

migrateData().catch(console.error);