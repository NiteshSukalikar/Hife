# Prompt For Next Phase: Phase 15 Request Details And Decision Flow

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 14 is complete. Request creation now uses human urgency labels while
keeping stored `P0`/`P1`/`P2`/`P3` values compatible, includes purchase timing
and purchase type, shows projected safe-to-spend and category impact, adds calm
inline budget guidance, and reviews high-impact requests before submission.

Start Phase 15 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Make the request details screen the central place for confident approval,
decline, postponement, purchase marking, and discussion.

Important constraints:

- Preserve Firestore compatibility for old and new request documents.
- Keep safe-to-spend as the main decision metric.
- Reuse the Phase 13 budget summary model and the Phase 14 request impact
  helper where it fits.
- Keep priority display human-readable; do not show raw P-codes in user-facing
  copy.
- Keep UI language calm, specific, and decision-focused.
- Avoid making discussion compete with the primary approve/decline/buy-later
  actions.
- Add focused tests for any new decision, impact, or presentation helpers.
- Run `npm.cmd run lint` and `npm.cmd test` before committing.

Recommended first tasks:

1. Replace the large missing-image area on the details screen with a polished
   neutral placeholder.
2. Show budget before request, request amount, and projected budget after
   approval.
3. Separate monthly safe-to-spend impact from selected category impact.
4. Make approve, decline, buy later, needs info, and purchased actions clearer
   and less cramped.
5. Require or strongly encourage a decision reason for decline and buy later.
6. Add a compact summary card explaining whether the request looks safe, risky,
   or over budget.
7. Keep the comments entry point available without pulling attention away from
   the decision controls.

Definition of done:

- Completed Phase 15 checklist items are marked with `[x]` in
  `UX_FINANCE_ROADMAP_PHASE.md`.
- Details screen priority labels remain human-readable.
- Details budget guidance uses safe-to-spend and category impact, not only raw
  monthly budget.
- Decision actions are clear on mobile and do not overlap or feel cramped.
- Old request documents still render correctly.
- `npm.cmd run lint` passes or any remaining issue is documented.
- `npm.cmd test` passes or any remaining issue is documented.
