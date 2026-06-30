# Prompt For Next Phase: Phase 14 Request Creation Flow Upgrade

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 13 is complete. The budget model now supports optional household income,
committed expenses, a savings reserve, conservative safe-to-spend calculations,
category approved/pending/purchased totals, and request impact warnings.

Start Phase 14 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Upgrade request creation so users can clearly judge timing, urgency, and budget
impact before asking for approval.

Important constraints:

- Preserve existing Firestore compatibility for request documents.
- Keep stored priority values compatible unless the schema is deliberately
  migrated.
- Replace technical priority labels in UI copy with human urgency language.
- Keep safe-to-spend as the main decision metric.
- Reuse the Phase 13 budget summary model for projected monthly and category
  impact.
- Keep UI language calm and decision-focused.
- Add focused tests for any new request validation or budget impact helpers.
- Run `npm.cmd run lint` and `npm.cmd test` before committing.

Recommended first tasks:

1. Map existing `P0`, `P1`, `P2`, and `P3` values to human urgency labels in the
   create flow while keeping internal values stable.
2. Add need-by date or purchase timing to the request draft if it can be done
   without breaking existing documents.
3. Add a simple "Can this wait?" or timing prompt near priority.
4. Show selected category budget, projected category remaining, safe-to-spend
   now, and projected safe-to-spend after the request.
5. Add inline guidance when the request would push safe-to-spend below zero or
   consume too much of the selected category.
6. Polish the missing-image state and form spacing so the create flow feels
   finished on mobile.

Definition of done:

- Completed Phase 14 checklist items are marked with `[x]` in
  `UX_FINANCE_ROADMAP_PHASE.md`.
- Existing request creation still works for rooms with old budget settings.
- The create flow uses human urgency labels instead of visible P-codes.
- Budget impact guidance uses Phase 13 safe-to-spend calculations.
- `npm.cmd run lint` passes or any remaining issue is documented.
- `npm.cmd test` passes or any remaining issue is documented.
