/**
 * Test script to check homepage API functionality
 * Run with: node scripts/testHomepageApi.js
 */

const axios = require('axios');

const BASE_URL = 'https://upvcconnect.com';

async function testHomepageApi() {
  console.log('🧪 Testing Homepage API...\n');
  
  try {
    console.log('📡 Making request to:', `${BASE_URL}/api/homepage`);
    const response = await axios.get(`${BASE_URL}/api/homepage`);
    
    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\n📋 Homepage Content Summary:');
      console.log('- Title:', data.title);
      console.log('- Subtitle:', data.subtitle);
      console.log('- Video URL:', data.videoUrl);
      console.log('- Sponsor Logo:', data.sponsorLogo);
      console.log('- Sponsor Text:', data.sponsorText);
      console.log('- Key Moments Count:', data.keyMoments ? data.keyMoments.length : 0);
      console.log('- Last Updated:', data.updatedAt);
      
      if (data.keyMoments && data.keyMoments.length > 0) {
        console.log('\n🎯 Key Moments:');
        data.keyMoments.forEach((moment, index) => {
          console.log(`  ${index + 1}. ${moment.title} (${moment.timestamp})`);
          console.log(`     Thumbnail: ${moment.thumbnail}`);
        });
      }
      
      // Check for URL duplication issues
      console.log('\n🔍 URL Analysis:');
      if (data.videoUrl && data.videoUrl.includes('https://upvcconnect.com/https://upvcconnect.com/')) {
        console.log('❌ ISSUE: Video URL has duplication:', data.videoUrl);
      } else {
        console.log('✅ Video URL looks good:', data.videoUrl);
      }
      
      if (data.keyMoments) {
        data.keyMoments.forEach((moment, index) => {
          if (moment.thumbnail && moment.thumbnail.includes('https://upvcconnect.com/https://upvcconnect.com/')) {
            console.log(`❌ ISSUE: Key moment ${index + 1} thumbnail has duplication:`, moment.thumbnail);
          } else {
            console.log(`✅ Key moment ${index + 1} thumbnail looks good:`, moment.thumbnail);
          }
        });
      }
      
    } else {
      console.log('⚠️  No homepage data found or API returned unsuccessful response');
    }
    
  } catch (error) {
    console.error('❌ Error testing homepage API:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
  }
}

// Run the test
testHomepageApi();