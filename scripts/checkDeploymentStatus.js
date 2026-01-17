/**
 * Check if backend changes have been deployed
 * Run with: node scripts/checkDeploymentStatus.js
 */

const axios = require('axios');

const BASE_URL = 'https://upvcconnect.com';

async function checkDeploymentStatus() {
  console.log('🚀 Checking Backend Deployment Status...\n');
  
  try {
    // Test 1: Check if URL helper is working by testing a known endpoint
    console.log('1️⃣ Testing URL Helper Integration...');
    const homepageResponse = await axios.get(`${BASE_URL}/api/homepage`);
    
    if (homepageResponse.data.success && homepageResponse.data.data) {
      const data = homepageResponse.data.data;
      
      // Check if URLs are properly formatted (should not have duplication)
      const hasUrlDuplication = 
        (data.videoUrl && data.videoUrl.includes('https://upvcconnect.com/https://upvcconnect.com/')) ||
        (data.sponsorLogo && data.sponsorLogo.includes('https://upvcconnect.com/https://upvcconnect.com/')) ||
        (data.keyMoments && data.keyMoments.some(m => m.thumbnail && m.thumbnail.includes('https://upvcconnect.com/https://upvcconnect.com/')));
      
      if (hasUrlDuplication) {
        console.log('❌ URL Helper NOT deployed - URLs still have duplication');
        console.log('   Video URL:', data.videoUrl);
        if (data.keyMoments && data.keyMoments.length > 0) {
          console.log('   First key moment thumbnail:', data.keyMoments[0].thumbnail);
        }
      } else {
        console.log('✅ URL Helper appears to be working - no URL duplication detected');
      }
    } else {
      console.log('⚠️  No homepage data to test URL helper with');
    }
    
    // Test 2: Check categories endpoint (we know this had issues)
    console.log('\n2️⃣ Testing Categories Endpoint...');
    try {
      const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`);
      if (categoriesResponse.data && categoriesResponse.data.length > 0) {
        const firstCategory = categoriesResponse.data[0];
        
        // Check if category videos have URL duplication
        if (firstCategory.videos && firstCategory.videos.length > 0) {
          const firstVideo = firstCategory.videos[0];
          if (firstVideo.videoUrl && firstVideo.videoUrl.includes('https://upvcconnect.com/https://upvcconnect.com/')) {
            console.log('❌ Categories endpoint still has URL duplication');
            console.log('   Example video URL:', firstVideo.videoUrl);
          } else {
            console.log('✅ Categories endpoint URLs look good');
          }
        } else if (firstCategory.videoUrl) {
          // Old format
          if (firstCategory.videoUrl.includes('https://upvcconnect.com/https://upvcconnect.com/')) {
            console.log('❌ Categories endpoint still has URL duplication (old format)');
            console.log('   Example video URL:', firstCategory.videoUrl);
          } else {
            console.log('✅ Categories endpoint URLs look good (old format)');
          }
        }
      }
    } catch (error) {
      console.log('❌ Error testing categories endpoint:', error.message);
    }
    
    // Test 3: Check server timestamp to see when it was last restarted
    console.log('\n3️⃣ Checking Server Status...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Server is responding');
    } catch (error) {
      console.log('⚠️  No health endpoint available');
    }
    
    console.log('\n📋 Summary:');
    console.log('- If you see URL duplication issues above, the backend changes have NOT been deployed yet');
    console.log('- If URLs look clean, the backend changes are working');
    console.log('- The frontend fixes should work regardless, but backend deployment will provide the permanent solution');
    
  } catch (error) {
    console.error('❌ Error checking deployment status:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

// Run the check
checkDeploymentStatus();