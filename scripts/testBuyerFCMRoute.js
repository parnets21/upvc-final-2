// Script to test buyer FCM token update route
const axios = require('axios');

async function testBuyerFCMRoute() {
  try {
    // First, login as a buyer to get a token
    console.log('Step 1: Logging in as buyer...');
    const loginResponse = await axios.post('https://upvcconnect.com/api/auth/login', {
      mobileNumber: '6362558587' // Use a real buyer mobile number
    });
    
    console.log('Login response:', loginResponse.data);
    const tempToken = loginResponse.data.token;
    const otp = loginResponse.data.otp;
    
    console.log('\nStep 2: Verifying OTP...');
    const verifyResponse = await axios.post(
      'https://upvcconnect.com/api/auth/verify-otp',
      {
        mobileNumber: '6362558587',
        otp: otp
      },
      {
        headers: {
          Authorization: `Bearer ${tempToken}`
        }
      }
    );
    
    console.log('Verify response:', verifyResponse.data);
    const buyerToken = verifyResponse.data.token;
    
    console.log('\nStep 3: Updating FCM token...');
    const fcmResponse = await axios.post(
      'https://upvcconnect.com/api/admin/buyers/update-fcm-token',
      {
        fcmToken: 'test_fcm_token_' + Date.now()
      },
      {
        headers: {
          Authorization: `Bearer ${buyerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('FCM update response:', fcmResponse.data);
    console.log('\n✅ SUCCESS! Buyer FCM token route is working!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Full error:', error);
  }
}

testBuyerFCMRoute();
