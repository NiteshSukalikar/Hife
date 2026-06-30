# Prompt For Next Phase: Phase 20 Verification And Release Quality

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 19 is complete. The dashboard now keeps the first-screen safe-to-spend
context intact and adds a focused finance insights panel for shared purchase
decisions: current-month category spend, past-month category spend, monthly
purchase history, decision counts, postponed/buy-later tracking, top categories
by approved spend, month-over-month comparison, repeat purchase signals, and a
monthly review summary. These are derived from existing request statuses and
budget helpers, with no request or budget schema migration.

Verification completed in Phase 19:

- `npm.cmd run lint` passes.
- `npm.cmd test` passes.
- `npx.cmd tsc --noEmit` passes.
- Compact web preview at 390px wide showed no page-level horizontal overflow in
  collapsed or expanded dashboard insight states.
- Expo web preview emitted existing compatibility warnings about package
  versions and web shadow props; these did not block the smoke test.

Start Phase 20 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Verify the redesigned Hife experience behaves like a reliable private-use money
decision product across onboarding, request creation, decision flow, discussion,
history, and edge cases.

Important constraints:

- Preserve household, request, budget, comment, and notification data
  compatibility.
- Keep the app positioned as shared purchase decisions, not a full personal
  finance suite.
- Keep the Phase 18 warm premium visual system.
- Avoid raw priority P-codes in user-facing copy.
- Do not reduce dashboard money clarity while improving edge cases.
- Long product names, large INR amounts, long decision reasons, long categories,
  links, and empty states must wrap without clipping or overlap on mobile.
- Capture screenshots after completing verification passes if useful for visual
  comparison.

Recommended first tasks:

1. Test the full flow from onboarding to budget setup to request creation.
2. Test approve, decline, buy later, needs info, and purchased states.
3. Test budget calculations with no income, no budget, over-budget, and exact
   budget cases.
4. Test category budgets with custom categories and very long category names.
5. Test dashboard readability with many requests and with no requests.
6. Test request details and discussion with long reasons, long comments, links,
   missing images, and image upload failure states.
7. Re-run compact Android-sized web/mobile preview checks.
8. Run `npm.cmd run lint`, `npm.cmd test`, and `npx.cmd tsc --noEmit`.
9. Mark completed Phase 20 checklist items in `UX_FINANCE_ROADMAP_PHASE.md`.

Definition of done:

- Phase 20 checklist items that have been verified are marked `[x]`.
- Core flows work from setup through decision and discussion.
- Edge-case money calculations and empty/low-data states are documented or
  fixed.
- No important text clips or overlaps at common Android viewport sizes.
- Required checks pass, or remaining issues are clearly documented.
- Screenshots are captured for visual comparison if the app changed visually.
