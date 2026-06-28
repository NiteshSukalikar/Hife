# Hife Release Checklist

Use this checklist before a personal or small private release.

## Automated Checks

- [ ] Install dependencies with `npm.cmd install`.
- [ ] Run lint with `npm.cmd run lint`.
- [ ] Run unit tests with `npm.cmd test`.
- [ ] Confirm Firestore rules and indexes are ready to deploy.

## Core Flow QA

- [ ] Create a request with product name, reason, priority, expected price, max
  budget, category, and at least one product link.
- [ ] Confirm validation blocks missing product name, missing reason, missing
  prices, over-limit text fields, and invalid links.
- [ ] Approve a pending request and confirm status, decision reason, and last
  activity update.
- [ ] Decline a pending request and confirm status, decision reason, and last
  activity update.
- [ ] Mark an approved request as purchased.
- [ ] Add comments and confirm comment count, latest comment text, and real-time
  updates.
- [ ] Create an invite code from one device and join the household from another
  device.
- [ ] Confirm requests and comments are scoped to the joined household.

## Media QA

- [ ] Upload a JPG image below 1 MB.
- [ ] Upload a PNG image below 1 MB.
- [ ] Upload a WebP image below 1 MB.
- [ ] Confirm oversized images are blocked before upload.
- [ ] Confirm unsupported image formats are blocked before upload.
- [ ] Confirm uploaded images display from their Cloudinary remote URL on the
  second device.

## Layout QA

- [ ] Android: verify request list, create request, request details, comments,
  and household screens.
- [ ] iOS: verify the same screens if an iOS device or simulator is available.
- [ ] Web: verify the same screens if web support is needed for the release.
- [ ] Confirm request cards show readable status and priority chips.
- [ ] Confirm create request counters and grouped fields fit without clipping.
- [ ] Confirm decline and cancel actions show confirmation dialogs.
- [ ] Confirm comments are readable for both current-user and partner bubbles.
- [ ] Confirm forms avoid keyboard overlap on mobile.
- [ ] Confirm buttons and tab controls have comfortable touch targets.

## Production Setup

- [ ] Restrict the Cloudinary unsigned preset as documented in
  `SECURITY_FREE_TIER.md`.
- [ ] Deploy Firestore rules and indexes:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

- [ ] Confirm Firebase Authentication anonymous sign-in is enabled.
- [ ] Confirm no production secrets are committed to the repository.
- [ ] Review free-tier usage in Firebase Console after the first real session.
- [ ] Keep AI recommendations optional and capped at 10 uncached requests per
  household per month.

## Release Notes

- [ ] Record the commit hash being released.
- [ ] Record the Firebase project used for the release.
- [ ] Record known limitations, including iOS or web support if not verified.
