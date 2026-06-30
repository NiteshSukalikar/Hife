# Prompt For Next Phase: Phase 12 Dashboard Redesign

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 11 is complete. The product is now positioned as a shared purchase
decision app with budget confidence, focused on answering: "Can we safely buy
this?"

Start Phase 12 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Redesign the home/dashboard experience so users understand their current money
state within the first screen before scanning purchase requests.

Important constraints:

- Preserve existing functionality and Firestore behavior.
- Do not revert unrelated local changes.
- Keep the warm premium palette from `BRAND_THEME.md`.
- Keep the app focused on shared purchase decisions, not full banking.
- Use clear finance language: safe to spend, approved, pending, remaining, after
  approval, category impact.
- Avoid clutter and avoid making the dashboard feel like a generic task list.
- Verify with lint/tests after implementation.

Recommended first tasks:

1. Add a safe-to-spend amount for the current month.
2. Show monthly budget, approved spend, pending spend, and remaining budget in a
   clearer hierarchy.
3. Add a simple budget health state such as Safe, Tight, Over Budget, or Needs
   Review.
4. Add a monthly budget progress bar.
5. Improve request cards so key purchase names and budget impact are easier to
   scan.

Definition of done:

- Phase 12 checklist items completed in `UX_FINANCE_ROADMAP_PHASE.md` are marked
  with `[x]`.
- Dashboard copy and layout answer "Can we safely buy this?" quickly.
- `npm.cmd run lint` passes or any remaining issue is documented.
- `npm.cmd test` passes or any remaining issue is documented.
