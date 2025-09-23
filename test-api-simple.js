// Simple test to check if API returns media data
const serviceId = '68d0c91c222d8a5eb7e6b657';

async function testApi() {
  try {
    console.log(`🔍 Testing API for service: ${serviceId}`);
    
    // Test with curl-like approach
    const response = await fetch(`http://localhost:3000/api/services/${serviceId}`);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Make sure the dev server is running on localhost:3000');
  }
}

testApi();
