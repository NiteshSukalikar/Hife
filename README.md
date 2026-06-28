# Hife

Hife is a household purchase request app for couples. One partner can create a
request with a product image, budget, priority, and details. The other partner
can review it, discuss it, and eventually approve, decline, postpone, or mark it
as purchased.

The app is currently an Expo/React Native prototype using Firebase Firestore for
data and Cloudinary for image uploads.

## Run The Project

Use `npm.cmd` on Windows PowerShell because `npm.ps1` may be blocked by
execution policy.

```powershell
npm.cmd install
npm.cmd run lint
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

## Current Direction

The current product loop supports:

Create purchase request -> discuss -> approve/decline/buy later/ask for more
info -> mark purchased.
