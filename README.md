# Hife

Hife is a household purchase request app for couples. One partner can create a
request with a product image, budget, priority, and details. The other partner
can review it, discuss it, and eventually approve, decline, postpone, or mark it
as purchased.

The app is currently an Expo/React Native prototype using Firebase Firestore for
data and Cloudinary for image uploads.

## Brand Theme

Hife uses a black and neon green identity:

- App black: `#050505`
- Neon green: `#39FF14`
- Theme guide: `BRAND_THEME.md`
- Logo source: `assets/brand/hife-logo.svg`

## Run The Project

Use `npm.cmd` on Windows PowerShell because `npm.ps1` may be blocked by
execution policy.

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd test
npm.cmd start
```

For web:

```powershell
npm.cmd run web
```

## Main Screens

- `app/(tabs)/index.tsx`: Request list.
- `app/(tabs)/explore.tsx`: Create request.
- `app/task/[id]/index.tsx`: Request details.
- `app/task/[id]/comments.tsx`: Request discussion.
- `services/`: Firebase, request, comment, and image upload helpers.

## Current Direction

The current product loop supports:

Create purchase request -> discuss -> approve/decline/buy later/ask for more
info -> mark purchased.

## Security And Free-Tier

- Firestore rules: `firestore.rules`
- Firestore deploy config: `firebase.json`
- Firestore index config: `firestore.indexes.json`
- Security/free-tier operating notes: `SECURITY_FREE_TIER.md`

## Release Readiness

Before sharing Hife with another household, complete the checklist in
`RELEASE_CHECKLIST.md`.

Minimum verification for a private release:

- `npm.cmd run lint`
- `npm.cmd test`
- Start Expo with `npm.cmd start`
- Verify create request, decision actions, image upload, comments, and household
  invite/join on the target devices
- Deploy Firestore rules and indexes after Firebase CLI setup:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```
