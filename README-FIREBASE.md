# CMA Tracker — Firebase-connected frontend

This build connects the CMA Tracker frontend to Firebase Authentication and Cloud Firestore.

## Firebase project
- Project ID: `cma-tracker-bdf7e`
- GitHub Pages domain authorized: `abhyasapp6-code.github.io`

## Enabled authentication
- Email/password
- Google
- Password reset
- Email verification on email/password registration

## Firestore
User data is stored under `users/{uid}`. The frontend keeps a local cache for fast rendering and writes changes to Firestore.

## Security rules
`firestore.rules` contains the rules used by the app. Publish the same rules in Firebase Console → Firestore Database → Rules.

## GitHub Pages
The frontend uses Firebase's browser SDK from Google's CDN, so no npm build is required. Upload/commit the files to the GitHub Pages repository.

## Important
Do not replace the Firebase configuration with another project unless you also update the Firebase console settings and authorized domains.
