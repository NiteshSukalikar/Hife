# Hife Security And Free-Tier Notes

## Firebase Security Rules

Firestore rules live in `firestore.rules` and are wired through `firebase.json`.
They enforce:

- Authenticated access only.
- Household reads only for members.
- Household creation only when the current user is the first member.
- Request reads/writes only for members of the request household.
- Comment reads/writes only for members of the parent request household.
- Status updates only through the expected decision fields.
- AI cache and AI usage documents scoped to the active household.

Deploy after installing the Firebase CLI:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

## Invite Codes

New households create an `inviteCodes/{code}` document that maps the six-character
invite code to the household id. Older households that only have an `inviteCode`
field should be migrated before locking production rules.

## Cloudinary Unsigned Upload Preset

The app still uses the unsigned preset `hife_unsigned`, so the preset must be
restricted in the Cloudinary dashboard:

- Folder: `hife/product-requests`
- Resource type: image only
- Allowed formats: `jpg`, `jpeg`, `png`, `webp`
- Maximum file size: `1 MB`
- Disable overwrite
- Disable moderation bypasses or transformations that are not needed

The client validates the same image formats and size before upload.

## AI Abuse Protection

AI recommendations are explicit user actions only. Results are cached per draft,
and uncached recommendations are limited to 10 per household per month. Usage is
incremented with a Firestore transaction so parallel taps cannot skip the limit.

## Read/Write Monitoring

The app records local daily read/write estimates in AsyncStorage through
`services/usageMonitoring.js`. This avoids adding extra Firestore writes just to
monitor usage. Production usage should still be checked in Firebase Console:

- Firestore reads
- Firestore writes
- Firestore deletes
- Stored data
- Network egress

Suggested soft alert thresholds for the free tier:

- Reads: review if a household exceeds 20,000 reads/day.
- Writes: review if a household exceeds 5,000 writes/day.
- AI: keep the app limit at 10 uncached recommendations/household/month.
- Images: keep product images below 1 MB and review Cloudinary bandwidth weekly.

## Logging

App screens use `utils/safeLogger.ts`, which redacts error details and only logs
in development. User-entered request text, comments, links, and invite codes
should not be logged.
