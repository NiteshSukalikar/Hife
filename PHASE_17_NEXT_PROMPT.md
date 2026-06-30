# Prompt For Next Phase: Phase 17 Onboarding And Setup Trust

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 16 is complete. The request discussion screen now has a compact request
summary, price/status/urgency/safe-to-spend context, latest-note context,
decision-focused quick replies, clearer mobile composer controls, comment link
source previews, improved chat contrast, and compatibility fallbacks for older
comment documents.

Start Phase 17 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Make first use reliable, clear, and trustworthy before users enter money
details.

Important constraints:

- Preserve existing household, request, budget, and comment data compatibility.
- Keep setup language calm and practical; this is a shared money app, not a
  generic task manager.
- Avoid raw priority P-codes in user-facing onboarding copy.
- Do not block returning users who already have an active household.
- Keep onboarding lightweight enough for private early use.
- Add focused tests for any new setup helper, validation helper, or onboarding
  presentation logic.
- Run `npm.cmd run lint` and `npm.cmd test` before committing.

Recommended first tasks:

1. Inspect current intro, household, and first-run paths for blank or failed
   screens.
2. Add a short onboarding path that explains Hife as shared purchase decisions.
3. Make room or household creation clear, including naming and partner roles.
4. Explain invite codes and passwords in plain language.
5. Add partner invite guidance after room creation.
6. Add first monthly budget setup during onboarding if it fits the current
   screen flow.
7. Add display name and role setup that feels human and editable.
8. Add fallback and retry states for setup failures.
9. Verify onboarding on Android-sized mobile layouts and preview web if useful.

Definition of done:

- Completed Phase 17 checklist items are marked with `[x]` in
  `UX_FINANCE_ROADMAP_PHASE.md`.
- New users can understand what Hife is for before entering money details.
- Household creation, invite guidance, and active-household routing are clear.
- Existing users with active household data are not forced through setup again.
- Setup failure states are visible and recoverable.
- `npm.cmd run lint` passes or any remaining issue is documented.
- `npm.cmd test` passes or any remaining issue is documented.
