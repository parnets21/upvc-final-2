const axios = require('axios');

async function testSellerAdvertisements() {
  try {
    console.log('🧪 Testing Seller Advertisements API...');
    
    // Test the corrected endpoint
    console.log('\n📡 Testing /api/advertisements endpoint...');
    const response = await axios.get('https://upvcconnect.com/api/advertisements');
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Number of advertisements:', response.data.ads?.length || 0);
    
    if (response.data.ads && response.data.ads.length > 0) {
      console.log('\n📹 Checking video URLs in advertisements:');
      
      response.data.ads.forEach((ad, index) => {
        console.log(`\n📁 Advertisement ${index + 1}: ${ad.title}`);
        console.log(`   Type: ${ad.type}`);
        
        if (ad.mediaUrl) {
          console.log(`   Media URL: ${ad.mediaUrl}`);
          
          // Check for duplicated URLs
          if (ad.mediaUrl.includes('https://upvcconnect.com/https://upvcconnect.com/')) {
            console.log('   ❌ DUPLICATED URL DETECTED!');
          } else if (ad.mediaUrl.startsWith('https://upvcconnect.com/')) {
            console.log('   ✅ URL looks clean (absolute)');
          } else if (ad.mediaUrl.startsWith('uploads/')) {
            console.log('   ⚠️  Relative URL (should be absolute)');
          } else {
            console.log('   ❓ Unknown URL format');
          }
        } else {
          console.log('   ⚠️  No media URL');
        }
        
        if (ad.thumbnailUrl) {
          console.log(`   Thumbnail URL: ${ad.thumbnailUrl}`);
        }
        
        if (ad.sponsorLogo) {
          console.log(`   Sponsor Logo URL: ${ad.sponsorLogo}`);
        }
      });
    } else {
      console.log('⚠️  No advertisements found');
    }
    
    // Test different types
    console.log('\n📡 Testing advertisement types...');
    const types = ['featured', 'latest', 'trending'];
    
    for (const type of types) {
      try {
        const typeResponse = await axios.get(`https://upvcconnect.com/api/advertisements/${type}`);
        console.log(`   ${type}: ${typeResponse.data.ads?.length || 0} ads`);
      } catch (error) {
        console.log(`   ${type}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing seller advertisements:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSellerAdvertisements();