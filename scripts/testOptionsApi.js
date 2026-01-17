const axios = require('axios');

async function testOptionsApi() {
  try {
    console.log('🧪 Testing /api/options endpoint...');
    
    const response = await axios.get('https://upvcconnect.com/api/options');
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Number of options:', response.data.length);
    
    // Check each option and its sub-options for video URLs
    response.data.forEach((option, index) => {
      console.log(`\n📁 Option ${index + 1}: ${option.title}`);
      console.log(`   Sub-options count: ${option.subOptions.length}`);
      
      option.subOptions.forEach((subOption, subIndex) => {
        console.log(`   📹 Sub-option ${subIndex + 1}: ${subOption.title}`);
        if (subOption.videoUrl) {
          console.log(`      Video URL: ${subOption.videoUrl}`);
          
          // Check for duplicated URLs
          if (subOption.videoUrl.includes('https://upvcconnect.com/https://upvcconnect.com/')) {
            console.log('      ❌ DUPLICATED URL DETECTED!');
          } else {
            console.log('      ✅ URL looks clean');
          }
        } else {
          console.log('      ⚠️  No video URL');
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error testing options API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOptionsApi();