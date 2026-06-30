# Prompt For Next Phase: Phase 13 Budget Model Upgrade

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 12 is complete. The dashboard now surfaces safe-to-spend, budget health,
monthly progress, category progress, clearer request-card impact, and better
empty states.

Start Phase 13 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Upgrade the budget model so Hife can make safer purchase decisions using income,
committed expenses, category totals, and a savings/emergency buffer.

Important constraints:

- Preserve existing Firestore compatibility where possible.
- Do not break existing rooms that only have `monthlyBudget` and
  `categoryBudgets`.
- Treat missing new budget fields as zero/default values.
- Keep UI language calm and decision-focused.
- Keep safe-to-spend as the core user-facing metric.
- Add tests for all new budget calculations.
- Run `npm.cmd run lint` and `npm.cmd test` before committing.

Recommended first tasks:

1. Extend `BudgetSettings` with optional income, committed expenses, and savings
   reserve fields.
2. Update budget settings UI so users can enter income, committed expenses, and
   emergency buffer/reserve.
3. Update `buildBudgetSummary` so safe-to-spend uses income, committed expenses,
   approved purchases, pending purchases, and savings reserve.
4. Add approved, pending, and purchased totals by category if any are missing or
   ambiguous.
5. Add warnings when a request would push safe-to-spend below zero or consume too
   much of a category.

Definition of done:

- Completed Phase 13 checklist items are marked with `[x]` in
  `UX_FINANCE_ROADMAP_PHASE.md`.
- Existing data still works with default values.
- Safe-to-spend calculation is covered by unit tests.
- `npm.cmd run lint` passes or any remaining issue is documented.
- `npm.cmd test` passes or any remaining issue is documented.
