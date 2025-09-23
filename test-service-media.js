const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testServiceMedia() {
  try {
    console.log('🔍 Checking services with media...');
    
    // Get all services with media
    const services = await prisma.service.findMany({
      include: {
        media: {
          select: {
            url: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
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
      take: 5,
    });

    console.log(`Found ${services.length} services:`);
    
    services.forEach((service, index) => {
      console.log(`\n--- Service ${index + 1} ---`);
      console.log(`ID: ${service.id}`);
      console.log(`Title: ${service.title}`);
      console.log(`Developer: ${service.developer.user.name}`);
      console.log(`Media count: ${service.media.length}`);
      
      if (service.media.length > 0) {
        console.log('Media items:');
        service.media.forEach((media, i) => {
          console.log(`  ${i + 1}. sortOrder: ${media.sortOrder}, URL: ${media.url}`);
        });
        
        // Categorize images
        const galleryImages = service.media
          .filter(media => media.sortOrder >= 1 && media.sortOrder <= 9)
          .map(media => media.url);
        
        const showcaseImages = service.media
          .filter(media => media.sortOrder >= 10)
          .map(media => media.url);
        
        console.log(`Gallery images (${galleryImages.length}):`, galleryImages);
        console.log(`Showcase images (${showcaseImages.length}):`, showcaseImages);
      } else {
        console.log('❌ No media found for this service');
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceMedia();
