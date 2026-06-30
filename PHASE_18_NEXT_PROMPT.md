# Prompt For Next Phase: Phase 18 Premium Visual Design Pass

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 17 is complete. First-run setup now explains Hife as shared purchase
decisions before users enter money details, supports clear room creation and
joining, explains invite codes and passwords, shows partner invite guidance
after room creation, captures display name and role labels, optionally sets the
first monthly budget and starting category budgets, preserves active-household
routing for returning users, and includes recoverable setup failure states.

Start Phase 18 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Make the app feel modern, trustworthy, and daily-use worthy with a cohesive
premium visual system across setup, dashboard, request creation, details, and
discussion.

Important constraints:

- Preserve existing household, request, budget, and comment data compatibility.
- Keep the app positioned as shared purchase decisions, not a generic task
  manager or full personal finance suite.
- Avoid raw priority P-codes in user-facing copy.
- Do not hide or reduce critical money context while improving visuals.
- Keep cards at 8px border radius or less unless an existing component pattern
  clearly requires otherwise.
- Avoid one-note palettes, especially all-purple, all-beige, all-dark-blue, or
  all-brown visual systems.
- Ensure long product names, large INR amounts, and long decision reasons do
  not clip or overlap on mobile.
- Add focused tests only where presentation helpers or logic are changed.
- Run `npm.cmd run lint` and `npm.cmd test` before committing.

Recommended first tasks:

1. Audit `constants/theme.ts`, `BRAND_THEME.md`, and core screen styles for
   conflicting palette direction.
2. Pick one final brand palette and document it clearly.
3. Reduce conflicting black/neon versus warm cream/clay styling.
4. Improve typography hierarchy for financial values, labels, and form text.
5. Normalize spacing, borders, and touch target sizes across setup, dashboard,
   request creation, details, and discussion.
6. Make status and urgency chips more consistent and scannable.
7. Verify compact Android-sized layouts for text clipping, overlap, and button
   fit.
8. Preview web if useful for responsive regressions.

Definition of done:

- Completed Phase 18 checklist items are marked with `[x]` in
  `UX_FINANCE_ROADMAP_PHASE.md`.
- The app has one coherent visual direction documented in the repo.
- Money values remain prominent and easy to scan.
- Setup, dashboard, request creation, details, and discussion feel visually
  related.
- Status chips, buttons, inputs, and budget cards use consistent spacing and
  touch targets.
- No important text clips or overlaps at common Android viewport sizes.
- `npm.cmd run lint` passes or any remaining issue is documented.
- `npm.cmd test` passes or any remaining issue is documented.
