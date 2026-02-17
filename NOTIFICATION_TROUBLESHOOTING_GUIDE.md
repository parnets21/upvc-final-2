# Notification Troubleshooting Guide

## Issue: Notifications Not Showing in Background/Foreground

### Changes Made

#### 1. Backend Changes
- ✅ Added FCM token collection during seller registration
- ✅ Added notification sending on application rejection
- ✅ Added notification sending on application approval
- ✅ Added notification sending on document rejection/approval

#### 2. Mobile App Changes

**File: `UPVC/index.js`**
- Added PushNotification configuration for background notifications
- Created notification channel for Android
- Enhanced background message handler to show local notifications

**File: `UPVC/App.jsx`**
- Improved foreground notification handler with type-specific handling
- Added proper Toast notifications for different notification types
- Added navigation handling when notifications are tapped

**File: `UPVC/src/screens/Seller/WelcomeProfileSetup.js`**
- Already collecting FCM token during registration ✅

## Testing Steps

### 1. Test FCM Token Collection

```javascript
// Check if FCM token is being collected
// Look for this log in React Native app:
console.log('FCM Token obtained:', fcmToken);
```

### 2. Test Backend Notification Sending

#### Test Document Rejection Notification

```bash
# Using curl or Postman
curl -X PUT https://upvcconnect.com/api/admin/sellers/:sellerId/documents/:documentType/reject \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Document is not clear"
  }'
```

#### Test Application Rejection Notification

```bash
curl -X PUT https://upvcconnect.com/api/admin/sellers/:sellerId/reject \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Incomplete documentation"
  }'
```

### 3. Check Backend Logs

Look for these logs in your backend console:

```
Successfully sent notification: <messageId>
```

If you see errors like:
```
Error sending notification: <error>
```

This indicates an issue with Firebase configuration.

## Common Issues and Solutions

### Issue 1: FCM Token Not Being Saved

**Symptoms:**
- Seller registers but no FCM token in database
- Backend logs show "No FCM token found"

**Solution:**
1. Check if notification permission is granted in the app
2. Verify Firebase configuration in the mobile app
3. Check if `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) is properly configured

**Verify FCM Token:**
```javascript
// In React Native app
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkToken = async () => {
  const token = await AsyncStorage.getItem('fcmToken');
  console.log('Stored FCM Token:', token);
};
```

### Issue 2: Notifications Not Showing in Background

**Symptoms:**
- App is closed or in background
- Notification is sent from backend
- No notification appears on device

**Solution:**
1. Ensure notification channel is created (Android)
2. Check if background message handler is registered
3. Verify Firebase Cloud Messaging is enabled in Firebase Console

**Check Android Notification Channel:**
```bash
# Using ADB
adb shell dumpsys notification_listener
```

### Issue 3: Notifications Not Showing in Foreground

**Symptoms:**
- App is open and active
- Notification is sent from backend
- No Toast or alert appears

**Solution:**
1. Check if foreground message handler is registered
2. Verify Toast component is properly configured
3. Check console logs for notification data

**Debug Foreground Notifications:**
```javascript
// In App.jsx, add more logging
NotificationService.onMessageReceived((remoteMessage) => {
  console.log('=== FOREGROUND NOTIFICATION DEBUG ===');
  console.log('Full message:', JSON.stringify(remoteMessage, null, 2));
  console.log('Notification type:', remoteMessage.data?.type);
  console.log('Title:', remoteMessage.notification?.title);
  console.log('Body:', remoteMessage.notification?.body);
  console.log('====================================');
});
```

### Issue 4: Firebase Configuration Issues

**Symptoms:**
- App crashes when trying to get FCM token
- Error: "Firebase not initialized"

**Solution:**

**For Android:**
1. Ensure `google-services.json` is in `android/app/` directory
2. Check `android/build.gradle` has Google Services plugin:
```gradle
classpath 'com.google.gms:google-services:4.3.15'
```
3. Check `android/app/build.gradle` applies the plugin:
```gradle
apply plugin: 'com.google.gms.google-services'
```

**For iOS:**
1. Ensure `GoogleService-Info.plist` is added to Xcode project
2. Run `cd ios && pod install`
3. Enable Push Notifications capability in Xcode

### Issue 5: Backend Not Sending Notifications

**Symptoms:**
- Backend API call succeeds
- No notification received on device
- No error in backend logs

**Solution:**

1. **Check Firebase Admin SDK Configuration:**
```javascript
// In UPVC_BACKEND_NEW/config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin initialized successfully');
```

2. **Verify Service Account Key:**
- Ensure `firebase-admin-key.json` exists
- Check if service account has proper permissions in Firebase Console
- Verify the key is not expired

3. **Test Notification Sending Manually:**
```javascript
// Create a test script: UPVC_BACKEND_NEW/scripts/testNotification.js
const { messaging } = require('../config/firebase');

async function testNotification() {
  const fcmToken = 'PASTE_ACTUAL_FCM_TOKEN_HERE';
  
  try {
    const message = {
      notification: {
        title: 'Test Notification',
        body: 'This is a test notification',
      },
      token: fcmToken,
    };
    
    const response = await messaging.send(message);
    console.log('Successfully sent:', response);
  } catch (error) {
    console.error('Error sending:', error);
  }
}

testNotification();
```

Run the test:
```bash
cd UPVC_BACKEND_NEW
node scripts/testNotification.js
```

## Verification Checklist

### Mobile App
- [ ] Firebase is properly configured (`google-services.json` / `GoogleService-Info.plist`)
- [ ] Notification permissions are requested and granted
- [ ] FCM token is being obtained and stored
- [ ] FCM token is sent during registration
- [ ] Background message handler is registered in `index.js`
- [ ] Foreground message handler is registered in `App.jsx`
- [ ] Notification channel is created (Android)
- [ ] Toast component is properly configured

### Backend
- [ ] Firebase Admin SDK is initialized
- [ ] Service account key file exists and is valid
- [ ] FCM token is stored in seller document
- [ ] Notification helper functions are imported correctly
- [ ] Notifications are being sent in reject/approve endpoints
- [ ] No errors in backend console logs

### Firebase Console
- [ ] Cloud Messaging API is enabled
- [ ] Service account has proper permissions
- [ ] No quota limits reached
- [ ] App is registered in Firebase project

## Testing Notification Flow End-to-End

### Step 1: Register a New Seller
1. Open the mobile app
2. Register as a seller with all required information
3. Check console logs for: `FCM Token obtained: <token>`
4. Verify token is sent to backend

### Step 2: Check Database
```javascript
// In MongoDB or your database
db.sellers.findOne({ phoneNumber: "1234567890" })
// Should show fcmToken field with a value
```

### Step 3: Reject Application from Admin Panel
1. Login to admin panel
2. Navigate to `/admin/sellers`
3. Find the seller
4. Click "Reject" and enter a reason
5. Submit

### Step 4: Verify Notification Received
**If app is in foreground:**
- Toast notification should appear at top of screen
- Check console: `Foreground notification received:`

**If app is in background:**
- System notification should appear in notification tray
- Check console: `Message handled in the background!`

**If app is closed:**
- System notification should appear in notification tray
- Tapping notification should open the app

## Debug Commands

### Check if FCM token exists in database
```bash
# Using MongoDB shell
mongo
use your_database_name
db.sellers.find({ fcmToken: { $exists: true } }).count()
```

### Check backend logs
```bash
# If using PM2
pm2 logs

# If running directly
# Check your terminal where server is running
```

### Check mobile app logs
```bash
# Android
adb logcat | grep -i "fcm\|notification"

# iOS
# Check Xcode console
```

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [React Native Push Notification](https://github.com/zo0r/react-native-push-notification)

## Support

If notifications are still not working after following this guide:

1. Collect the following information:
   - Backend logs (last 50 lines)
   - Mobile app console logs
   - FCM token from database
   - Firebase project configuration
   - Error messages (if any)

2. Check Firebase Console > Cloud Messaging > Reports for delivery status

3. Verify the FCM token is valid by testing it in Firebase Console:
   - Go to Firebase Console > Cloud Messaging
   - Click "Send test message"
   - Paste the FCM token
   - Send the test message
