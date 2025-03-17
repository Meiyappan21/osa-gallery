const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

async function checkDatabases() {
  // First check the development database
  const devEnv = dotenv.config({ 
    path: path.join(process.cwd(), '.env.development')
  }).parsed;
  
  console.log('\nDevelopment Database URL:', devEnv.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  
  const devPrisma = new PrismaClient({
    datasources: { db: { url: devEnv.DATABASE_URL } }
  });

  // Check development database
  try {
    console.log('\nDevelopment Database Contents:');
    const devCounts = await Promise.all([
      devPrisma.user.count(),
      devPrisma.project.count(),
      devPrisma.avatar.count(),
      devPrisma.tag.count()
    ]);
    
    console.log({
      users: devCounts[0],
      projects: devCounts[1],
      avatars: devCounts[2],
      tags: devCounts[3]
    });

    // Get a sample user if any exist
    if (devCounts[0] > 0) {
      const sampleUser = await devPrisma.user.findFirst();
      console.log('\nSample user from development:', sampleUser);
    }
  } catch (error) {
    console.error('Error checking development database:', error);
  }

  // Now check the production database
  const prodEnv = dotenv.config({ 
    path: path.join(process.cwd(), '.env.production')
  }).parsed;
  
  console.log('\nProduction Database URL:', prodEnv.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  
  const prodPrisma = new PrismaClient({
    datasources: { db: { url: prodEnv.DATABASE_URL } }
  });

  // Check production database
  try {
    console.log('\nProduction Database Contents:');
    const prodCounts = await Promise.all([
      prodPrisma.user.count(),
      prodPrisma.project.count(),
      prodPrisma.avatar.count(),
      prodPrisma.tag.count()
    ]);
    
    console.log({
      users: prodCounts[0],
      projects: prodCounts[1],
      avatars: prodCounts[2],
      tags: prodCounts[3]
    });

    // Get a sample user if any exist
    if (prodCounts[0] > 0) {
      const sampleUser = await prodPrisma.user.findFirst();
      console.log('\nSample user from production:', sampleUser);
    }
  } catch (error) {
    console.error('Error checking production database:', error);
  }

  await devPrisma.$disconnect();
  await prodPrisma.$disconnect();
}

checkDatabases().catch(console.error);