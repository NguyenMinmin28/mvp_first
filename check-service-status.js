const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkServiceStatus() {
  try {
    console.log('🔍 Checking service status...');
    
    const serviceId = '68d0c91c222d8a5eb7e6b657'; // Service có media data
    
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        media: {
          select: {
            url: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (service) {
      console.log('Service found:');
      console.log(`- ID: ${service.id}`);
      console.log(`- Title: ${service.title}`);
      console.log(`- Status: ${service.status}`);
      console.log(`- Visibility: ${service.visibility}`);
      console.log(`- Media count: ${service.media.length}`);
      
      if (service.media.length > 0) {
        console.log('Media items:');
        service.media.forEach((media, i) => {
          console.log(`  ${i + 1}. sortOrder: ${media.sortOrder}, URL: ${media.url}`);
        });
      }
    } else {
      console.log('❌ Service not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceStatus();
