const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Try to use environment variable first, fallback to file
  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Use environment variable (JSON string)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Fallback to file (for local development)
    try {
      const serviceAccount = require('./firebase-admin-key.json');
      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      console.error('Firebase Admin Key not found. Please set FIREBASE_SERVICE_ACCOUNT environment variable or add firebase-admin-key.json file.');
      throw error;
    }
  }

  admin.initializeApp({
    credential: credential,
    projectId: 'upvc-connect'
  });
}

const messaging = admin.messaging();

module.exports = { admin, messaging };
