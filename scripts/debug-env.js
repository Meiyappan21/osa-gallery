const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Debug function to safely log URLs
function logSafeUrl(url, label) {
  if (!url) return console.log(`${label}: Not found`);
  // Keep project ID visible but hide password
  const safeUrl = url.replace(/:([^:@]+)@/, ':***@');
  console.log(`${label}: ${safeUrl}`);
}

async function debugEnvironment() {
  console.log('Current working directory:', process.cwd());
  
  // Check for root .env
  const rootEnv = dotenv.config().parsed || {};
  console.log('\nRoot .env file:', rootEnv.DATABASE_URL ? 'Found' : 'Not found');
  if (rootEnv.DATABASE_URL) logSafeUrl(rootEnv.DATABASE_URL, 'Root DATABASE_URL');

  // Clear environment
  delete process.env.DATABASE_URL;

  // Load development
  const devEnv = dotenv.config({ 
    path: path.join(process.cwd(), '.env.development'),
    override: true 
  }).parsed || {};
  console.log('\n.env.development file:', devEnv.DATABASE_URL ? 'Found' : 'Not found');
  if (devEnv.DATABASE_URL) logSafeUrl(devEnv.DATABASE_URL, 'Development DATABASE_URL');

  // Clear again
  delete process.env.DATABASE_URL;

  // Load production
  const prodEnv = dotenv.config({ 
    path: path.join(process.cwd(), '.env.production'),
    override: true 
  }).parsed || {};
  console.log('\n.env.production file:', prodEnv.DATABASE_URL ? 'Found' : 'Not found');
  if (prodEnv.DATABASE_URL) logSafeUrl(prodEnv.DATABASE_URL, 'Production DATABASE_URL');

  // Try connections
  if (devEnv.DATABASE_URL && prodEnv.DATABASE_URL) {
    console.log('\nTesting database connections...');
    
    const devPrisma = new PrismaClient({
      datasources: { db: { url: devEnv.DATABASE_URL } },
      log: ['error']
    });

    const prodPrisma = new PrismaClient({
      datasources: { db: { url: prodEnv.DATABASE_URL } },
      log: ['error']
    });

    try {
      console.log('\nTesting development connection...');
      const devResult = await devPrisma.$queryRaw`SELECT current_database()`;
      console.log('✅ Development connection successful:', devResult[0].current_database);
    } catch (error) {
      console.error('❌ Development connection failed:', error.message);
    }

    try {
      console.log('\nTesting production connection...');
      const prodResult = await prodPrisma.$queryRaw`SELECT current_database()`;
      console.log('✅ Production connection successful:', prodResult[0].current_database);
    } catch (error) {
      console.error('❌ Production connection failed:', error.message);
    }

    await devPrisma.$disconnect();
    await prodPrisma.$disconnect();
  }
}

debugEnvironment().catch(console.error);