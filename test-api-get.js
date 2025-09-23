// Test API GET service directly
const serviceId = '68d0c91c222d8a5eb7e6b657'; // Service có media data

async function testApiGet() {
  try {
    console.log(`🔍 Testing API GET service: ${serviceId}`);
    
    const response = await fetch(`http://localhost:3000/api/services/${serviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n📊 Service Data Analysis:');
      console.log(`- Title: ${data.data.title}`);
      console.log(`- Gallery Images: ${data.data.galleryImages?.length || 0}`);
      console.log(`- Showcase Images: ${data.data.showcaseImages?.length || 0}`);
      
      if (data.data.galleryImages) {
        console.log('Gallery Images:', data.data.galleryImages);
      }
      
      if (data.data.showcaseImages) {
        console.log('Showcase Images:', data.data.showcaseImages);
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApiGet();
