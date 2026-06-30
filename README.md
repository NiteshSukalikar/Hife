# Hife

Hife is a shared purchase decision app for couples, rooms, and small groups.
It helps people answer one practical money question before buying something:
"Can we safely buy this?"

One person can create a request with a product image, reason, expected price,
budget context, priority, and links. The other person can review the impact,
discuss it, and approve, decline, postpone, ask for more information, or mark it
as purchased.

The app is currently an Expo/React Native prototype using Firebase Firestore for
data and Cloudinary for image uploads.

## Product Positioning

Hife is not trying to be a full bank replacement or complete personal finance
suite yet. The current product focus is:

- Shared purchase decisions
- Monthly room or household budget confidence
- Category budget awareness
- Partner discussion and approval history
- Calm, low-stress spending decisions

The app should avoid overpromising full budgeting features until income,
committed expenses, savings buffers, and deeper spending insights are complete.

## Brand Theme

Hife uses a warm premium identity designed to feel calm, trustworthy, and
human for money conversations:

- Warm cream page background
- Charcoal and dark espresso surfaces
- Clay/copper primary actions
- Sage positive states
- Amber pending or warning states
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
