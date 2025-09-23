const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentServices() {
  try {
    console.log('🔍 Checking recent services...');
    
    // Get recent services
    const services = await prisma.service.findMany({
      include: {
        media: true,
        developer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    console.log(`Found ${services.length} recent services:`);
    
    services.forEach((service, index) => {
      console.log(`\n--- Service ${index + 1} ---`);
      console.log(`ID: ${service.id}`);
      console.log(`Title: ${service.title}`);
      console.log(`Developer: ${service.developer.user.name}`);
      console.log(`Created: ${service.createdAt}`);
      console.log(`Cover URL: ${service.coverUrl}`);
      console.log(`Media count: ${service.media.length}`);
      
      if (service.media.length > 0) {
        console.log('Media items:');
        service.media.forEach((media, i) => {
          console.log(`  ${i + 1}. sortOrder: ${media.sortOrder}, URL: ${media.url}`);
        });
      } else {
        console.log('❌ No media found for this service');
      }
    });

    // Check if there are any media records at all
    const totalMedia = await prisma.serviceMedia.count();
    console.log(`\n📊 Total media records in database: ${totalMedia}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentServices();
