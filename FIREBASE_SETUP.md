# Firebase Setup Instructions

## Firebase Admin SDK Configuration

This project uses Firebase Cloud Messaging (FCM) for push notifications.

### Setup Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Rename it to `firebase-admin-key.json`
7. Place it in the `config/` directory

### File Location:
```
UPVC_BACKEND_NEW/
  └── config/
      └── firebase-admin-key.json  (DO NOT COMMIT THIS FILE)
```

### Security Note:
- The `firebase-admin-key.json` file contains sensitive credentials
- It is already added to `.gitignore` to prevent accidental commits
- Never commit this file to version control
- Use environment variables or secure secret management in production

### Example Structure:
See `config/firebase-admin-key.example.json` for the expected file structure.
