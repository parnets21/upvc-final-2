# Seller Application Notification Implementation

## Overview
This document describes the implementation of FCM (Firebase Cloud Messaging) notifications for seller application status updates in the admin panel.

## Features Implemented

### 1. FCM Token Collection During Registration
- **Endpoint**: `POST /api/seller/register`
- **New Field**: `fcmToken` (optional)
- Sellers can now provide their FCM token during registration
- The token is stored in the Seller model for future notifications

### 2. Application Rejection Notification
- **Endpoint**: `PUT /api/admin/sellers/:sellerId/reject`
- When an admin rejects a seller application, the seller receives a push notification
- Notification includes the rejection reason
- Only sent if the seller has provided an FCM token

### 3. Application Approval Notification
- **Endpoint**: `PUT /api/admin/sellers/:sellerId/approve`
- When an admin approves a seller application, the seller receives a congratulatory push notification
- Notification confirms their approval and ability to receive leads
- Only sent if the seller has provided an FCM token

## Technical Implementation

### Modified Files

#### 1. `controllers/Seller/sellerController.js`
- **registerSeller**: Now accepts `fcmToken` in request body and stores it
- **approveSeller**: Sends approval notification after approving seller
- **rejectSeller**: Sends rejection notification with reason after rejecting seller

#### 2. `utils/notificationHelper.js`
Added two new notification functions:
- `sendSellerApplicationRejectionNotification(fcmToken, reason)`
- `sendSellerApplicationApprovalNotification(fcmToken)`

#### 3. `models/Seller/Seller.js`
Already had `fcmToken` field defined - no changes needed

## API Usage

### Register Seller with FCM Token
```javascript
POST /api/seller/register
Content-Type: multipart/form-data

{
  "phoneNumber": "1234567890",
  "companyName": "ABC Company",
  "fcmToken": "device_fcm_token_here",
  // ... other fields
}
```

### Approve Seller (Admin)
```javascript
PUT /api/admin/sellers/:sellerId/approve
Authorization: Bearer <admin_token>

// Response includes notification status
{
  "success": true,
  "message": "Seller approved successfully",
  "seller": { ... }
}
```

### Reject Seller (Admin)
```javascript
PUT /api/admin/sellers/:sellerId/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Incomplete documentation"
}

// Response includes notification status
{
  "success": true,
  "message": "Seller rejected successfully",
  "seller": { ... }
}
```

## Notification Details

### Rejection Notification
- **Title**: "Application Rejected"
- **Body**: "Your seller application has been rejected. Reason: {reason}"
- **Data Payload**:
  ```json
  {
    "type": "application_rejection",
    "reason": "rejection reason text"
  }
  ```

### Approval Notification
- **Title**: "Application Approved!"
- **Body**: "Congratulations! Your seller application has been approved. You can now start receiving leads."
- **Data Payload**:
  ```json
  {
    "type": "application_approval"
  }
  ```

## Frontend Integration Guide

### 1. Collect FCM Token on Seller App
```javascript
import messaging from '@react-native-firebase/messaging';

// Request permission and get token
async function getFCMToken() {
  const authStatus = await messaging().requestPermission();
  if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
    const token = await messaging().getToken();
    return token;
  }
  return null;
}

// Include token during registration
const fcmToken = await getFCMToken();
const formData = new FormData();
formData.append('fcmToken', fcmToken);
// ... append other fields
```

### 2. Handle Notifications in Seller App
```javascript
import messaging from '@react-native-firebase/messaging';

// Foreground notification handler
messaging().onMessage(async remoteMessage => {
  const { type, reason } = remoteMessage.data;
  
  if (type === 'application_rejection') {
    // Show rejection alert with reason
    Alert.alert(
      'Application Rejected',
      `Your application was rejected. Reason: ${reason}`,
      [{ text: 'OK' }]
    );
  } else if (type === 'application_approval') {
    // Show approval alert
    Alert.alert(
      'Application Approved!',
      'Congratulations! You can now start receiving leads.',
      [{ text: 'OK' }]
    );
  }
});

// Background/Quit state notification handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);
});
```

### 3. Update FCM Token (Optional)
If you want to allow sellers to update their FCM token later:
```javascript
PUT /api/seller/update-fcm-token
Authorization: Bearer <seller_token>
Content-Type: application/json

{
  "fcmToken": "new_device_token"
}
```

## Testing

### Test Rejection Notification
1. Register a seller with a valid FCM token
2. Login to admin panel
3. Navigate to `/admin/sellers`
4. Find the seller and click "Reject"
5. Enter a rejection reason
6. Verify the seller receives a push notification

### Test Approval Notification
1. Register a seller with a valid FCM token
2. Login to admin panel
3. Navigate to `/admin/sellers`
4. Find the seller and click "Approve"
5. Verify the seller receives a push notification

## Error Handling
- If FCM token is not provided, the system continues without sending notifications
- If notification sending fails, it's logged but doesn't affect the approval/rejection process
- Notifications are sent asynchronously to avoid blocking the API response

## Security Considerations
- FCM tokens are stored securely in the database
- Only authenticated admins can approve/reject sellers
- Notification content doesn't include sensitive information
- FCM tokens are device-specific and can be revoked

## Future Enhancements
- Add notification history tracking
- Implement notification preferences
- Add email notifications as backup
- Create notification templates for different scenarios
- Add notification analytics
