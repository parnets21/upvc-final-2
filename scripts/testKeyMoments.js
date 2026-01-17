/**
 * Test script to check key moments functionality
 * Run with: node scripts/testKeyMoments.js
 */

const axios = require('axios');

const BASE_URL = 'https://upvcconnect.com';

async function testKeyMoments() {
  console.log('🎯 Testing Key Moments Functionality...\n');
  
  try {
    // Get current homepage data
    console.log('📡 Fetching current homepage data...');
    const response = await axios.get(`${BASE_URL}/api/homepage`);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      
      console.log('✅ Homepage data retrieved successfully');
      console.log('📊 Current Key Moments Count:', data.keyMoments ? data.keyMoments.length : 0);
      
      if (data.keyMoments && data.keyMoments.length > 0) {
        console.log('\n🎯 Existing Key Moments:');
        data.keyMoments.forEach((moment, index) => {
          console.log(`  ${index + 1}. "${moment.title}" at ${moment.timestamp}`);
          console.log(`     Thumbnail: ${moment.thumbnail}`);
          console.log(`     ID: ${moment._id}`);
        });
      } else {
        console.log('\n⚠️  No key moments found!');
        console.log('   This explains why you\'re not seeing updated content.');
        console.log('   You need to add key moments through the admin panel.');
      }
      
      // Check last update time
      const lastUpdate = new Date(data.updatedAt);
      const now = new Date();
      const timeDiff = Math.round((now - lastUpdate) / (1000 * 60)); // minutes
      
      console.log('\n⏰ Last Updated:', lastUpdate.toLocaleString());
      console.log('   Time since update:', timeDiff, 'minutes ago');
      
      if (timeDiff > 60) {
        console.log('   ⚠️  This was updated more than an hour ago - might be old data');
      } else {
        console.log('   ✅ Recent update - data should be current');
      }
      
    } else {
      console.log('❌ No homepage data found or API returned error');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing key moments:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
  }
}

// Run the test
testKeyMoments();