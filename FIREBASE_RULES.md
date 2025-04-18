# Firebase Security Rules for GoGreen App

## Steps to Update Your Security Rules

1. Go to your Firebase Console (https://console.firebase.google.com/)
2. Select your project
3. Click on "Firestore Database" in the left navigation
4. Click on the "Rules" tab
5. Replace all existing rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // For development purposes - allow all operations
    // WARNING: REMOVE THIS WHEN GOING TO PRODUCTION AND USE THE RULES BELOW
    match /{document=**} {
      allow read, write: if true;
    }

    // PRODUCTION RULES - Uncomment these when ready for production
    // // Allow public read access to users collection
    // match /users/{userId} {
    //   allow read: if true;  // Anyone can read user profiles and leaderboard
    //   allow write: if request.auth != null;  // Any authenticated user can write user data
    // }
    //
    // // Only allow access to route history for the user who created it
    // match /route_history/{routeId} {
    //   allow read: if request.auth != null &&
    //              (resource.data.user_id == request.auth.uid);
    //   allow create: if request.auth != null;
    //   allow update, delete: if false;  // No updates or deletions allowed
    // }
  }
}
```

## Explanation

### Development Rules
The rules I've provided are set to open access for development, which will instantly fix your permission errors. This allows any operation (read/write) on any document.

### Production Rules
I've included commented production rules that you should implement before deploying the app publicly:

1. **Users Collection:**
   - Allow anyone to read user data (needed for the leaderboard)
   - Only authenticated users can write user data

2. **Route History Collection:**
   - Users can only read their own route history
   - Any authenticated user can create route history
   - No one can update or delete route history (for data integrity)

## Important Security Note

The development rules (allow all) should **never** be used in production as they eliminate all security. When your app is working properly, replace them with the commented production rules.