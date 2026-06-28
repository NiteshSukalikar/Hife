# Hife Project Runbook

## Project Location

```powershell
S:\Other\Hife
```

## Stack

- Expo
- React Native
- Expo Router
- TypeScript
- Firebase Firestore
- Cloudinary image upload

## Brand Assets

- `BRAND_THEME.md`: Black and neon green brand/theme guide.
- `assets/brand/hife-logo.svg`: Source logo artwork.
- `assets/images/icon.png`: Main app icon and thumbnail mark.
- `assets/images/favicon.png`: Web favicon.
- `assets/images/splash-icon.png`: Startup splash logo.
- `assets/images/android-icon-foreground.png`: Android adaptive icon foreground.
- `assets/images/android-icon-background.png`: Android adaptive icon background.
- `assets/images/android-icon-monochrome.png`: Android monochrome icon.

## Important Commands

Use `npm.cmd` on Windows PowerShell because `npm.ps1` may be blocked by the system execution policy.

Install dependencies:

```powershell
npm.cmd install
```

Run lint:

```powershell
npm.cmd run lint
```

Start Expo:

```powershell
npm.cmd start
```

Start web version:

```powershell
npm.cmd run web
```

Start Android:

```powershell
npm.cmd run android
```

Start iOS:

```powershell
npm.cmd run ios
```

## Fast Start For Next Session

1. Open the project folder:

```powershell
Set-Location S:\Other\Hife
```

2. Check project status:

```powershell
git status --short
```

3. Run lint:

```powershell
npm.cmd run lint
```

4. Start Expo:

```powershell
npm.cmd start
```

If a web preview is needed:

```powershell
npm.cmd run web
```

## Known PowerShell Issue

Running this may fail:

```powershell
npm run lint
```

Reason: PowerShell may block `npm.ps1` because script execution is disabled.

Use this instead:

```powershell
npm.cmd run lint
```

## Current Main Screens

- `app/(tabs)/index.tsx`: Home/request list screen.
- `app/(tabs)/explore.tsx`: Create request screen.
- `app/task/[id]/index.tsx`: Request details screen.
- `app/task/[id]/comments.tsx`: Comments/discussion screen.

## Current API Helpers

- `services/purchaseRequests.js`: Creates, reads, and updates requests in Firestore.
- `services/comments.js`: Creates and reads comments for a request.
- `services/uploadImage.js`: Uploads images to Cloudinary.
- `services/firebase.js`: Firebase initialization.
- `utils/deviceUser.js`: Creates a local device-based user ID.

## Useful Review Notes

- Product-facing language now uses `request` instead of `ticket`.
- The current status is only `open`; the product still needs statuses such as `pending`, `approved`, `declined`, `buy_later`, and `purchased`.
- The create request screen stores the uploaded Cloudinary URL for request images.
- The app uses INR labels for budget display.
- Expo starter README and visible starter modal content have been replaced.

## Recommended First Fixes

1. Add approve, decline, and buy-later actions.
2. Add structured product links to the request model.
3. Add partner/household pairing.
4. Add budget summary and status filters.
5. Add AI decision assistance behind an explicit `Ask AI` button.

## Verification Checklist

Before finishing a change:

- Run lint with `npm.cmd run lint`.
- Start Expo and check the changed screen.
- Confirm no starter UI appears in the changed flow.
- Confirm INR formatting is consistent.
- Confirm images work across devices by using remote URLs.
- Confirm Firebase writes match the expected request/comment shape.
