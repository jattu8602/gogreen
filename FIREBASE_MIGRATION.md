# Migration Guide from Supabase to Firebase with Cloudinary

This guide explains how to migrate your GoGreen app from Supabase to Firebase for database functionality and Cloudinary for image storage.

## Prerequisites

1. Create a Firebase account and project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Create a Cloudinary account at [https://cloudinary.com/](https://cloudinary.com/)
3. Install required dependencies:
   ```bash
   npm install firebase @firebase/firestore @firebase/auth cloudinary-react-native
   ```

## Step 1: Set Up Firebase

1. Go to the Firebase console
2. Create a new project (or use an existing one)
3. Enable Firestore database (start in test mode for development)
4. Add a web app to your Firebase project to get configuration
5. Copy your Firebase config values to `.env` file:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

## Step 2: Set Up Cloudinary

1. Log in to your Cloudinary dashboard
2. Navigate to Settings > Upload
3. Create an upload preset named `gogreen_profiles` (or another name of your choice)
4. Set Upload preset mode to `Unsigned`
5. Update your `.env` file with Cloudinary settings:
   ```
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=gogreen_profiles
   ```

## Step 3: Create Database Schema in Firestore

1. Create `users` collection with the following fields:

   - `id` (string, document ID): UUID generated from Clerk ID
   - `clerk_id` (string): Original Clerk ID
   - `full_name` (string): User's full name
   - `username` (string): Username
   - `profile_url` (string): URL to profile image
   - `green_score` (number): Environmental score

2. Create `route_history` collection with the following fields:
   - `id` (string, document ID): Auto-generated
   - `user_id` (string): Reference to user ID
   - `start_lat` (number): Starting latitude
   - `start_lng` (number): Starting longitude
   - `end_lat` (number): Ending latitude
   - `end_lng` (number): Ending longitude
   - `distance` (number): Route distance in km
   - `duration` (string): Duration text
   - `co2_emission` (number): CO2 emission in kg
   - `vehicle_type` (string): Type of vehicle used
   - `route_type` (string): Type of route chosen
   - `green_points` (number): Green points earned
   - `created_at` (timestamp): Creation timestamp

## Step 4: Data Migration from Supabase to Firebase

### Export Users from Supabase

1. Run this SQL query in Supabase SQL Editor:
   ```sql
   SELECT * FROM users;
   ```
2. Export results as JSON

### Export Route History from Supabase

1. Run this SQL query in Supabase SQL Editor:
   ```sql
   SELECT * FROM route_history;
   ```
2. Export results as JSON

### Import Data to Firebase

1. Create a script to import the data:

   ```javascript
   const admin = require('firebase-admin')
   const serviceAccount = require('./path-to-service-account.json')
   const fs = require('fs')

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
   })

   const db = admin.firestore()

   // Import users
   const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
   const usersPromises = users.map((user) => {
     return db.collection('users').doc(user.id).set(user)
   })

   // Import route history
   const routes = JSON.parse(fs.readFileSync('./route_history.json', 'utf8'))
   const routesPromises = routes.map((route) => {
     // Convert created_at to Firestore timestamp
     if (route.created_at) {
       route.created_at = admin.firestore.Timestamp.fromDate(
         new Date(route.created_at)
       )
     }
     return db.collection('route_history').add(route)
   })

   Promise.all([...usersPromises, ...routesPromises])
     .then(() => console.log('Migration completed'))
     .catch((err) => console.error('Migration error:', err))
   ```

## Step 5: Testing

After migration, test the application thoroughly:

1. Authentication flow
2. User profile image upload
3. Leaderboard display
4. Route saving
5. Green score updates

## File Changes

The migration has affected several files in your project:

1. Created new files:

   - `/lib/firebase.ts`: Firebase configuration
   - `/lib/cloudinary.ts`: Cloudinary configuration
   - `/lib/userService.ts`: User data operations
   - `/lib/routeService.ts`: Route history operations

2. Modified files:
   - `/app/(tabs)/leaderboard.tsx`: Updated to use Firebase and Cloudinary
   - `/app/(tabs)/index.tsx`: Updated route saving logic
   - `/.env.example`: Updated with Firebase and Cloudinary variables

## Security Rules

### Firestore Security Rules

Set up these security rules in the Firebase console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null &&
                    (request.auth.uid == userId ||
                    request.resource.data.clerk_id == request.auth.uid);
    }

    // Only allow access to route history for the user who created it
    match /route_history/{routeId} {
      allow read: if request.auth != null &&
                   resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null &&
                    request.resource.data.user_id == request.auth.uid;
      allow update, delete: if false;  // No updates or deletions allowed
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Issues**: If users cannot sign in, check Clerk integration with Firebase.
2. **Image Upload Failures**: Verify Cloudinary upload preset is configured correctly and is set to "unsigned".
3. **Firestore Permission Denied**: Check security rules to ensure proper access permissions.
4. **Data Migration Problems**: If some data fails to migrate, you may need to clean or transform it before importing.

### Debugging

1. Add detailed console logging to critical functions.
2. Check Firebase console for error messages.
3. Use Firebase Authentication Emulator and Firestore Emulator for local testing.

---

If you encounter issues during migration, check the [Firebase Documentation](https://firebase.google.com/docs) and [Cloudinary Documentation](https://cloudinary.com/documentation) for detailed guidance.
