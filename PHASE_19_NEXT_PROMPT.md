# Prompt For Next Phase: Phase 19 Finance Insights And History

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 18 is complete. The app now uses one documented warm premium visual
system across setup, dashboard, request creation, request details, and
discussion. The old black/neon versus cream/clay conflict has been removed,
money values remain prominent, core cards use 8px radius, chips/buttons/inputs
are more consistent, and mobile/web preview checks at compact Android width did
not show page-level overflow or important text clipping.

Start Phase 19 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Add focused finance insights and purchase history that help a household
understand shared purchase decisions over time without turning Hife into a full
personal finance suite.

Important constraints:

- Preserve existing household, request, budget, and comment data compatibility.
- Keep the app positioned as shared purchase decisions, not a generic task
  manager or full personal finance product.
- Use existing request statuses and budget helpers where possible before adding
  new data structures.
- Avoid raw priority P-codes in user-facing copy.
- Do not hide or reduce critical money context on the dashboard while adding
  history.
- Keep the Phase 18 visual system: warm cream background, white cards, clay
  primary actions, sage/amber semantic states, charcoal text, linen borders, and
  8px card radius.
- Ensure long product names, large INR amounts, long category names, and empty
  history states do not clip or overlap on mobile.
- Add focused tests for any new aggregation, date grouping, or presentation
  helpers.
- Run `npm.cmd run lint` and `npm.cmd test` before committing.

Recommended first tasks:

1. Audit current request and budget helper APIs for reusable monthly/category
   aggregation logic.
2. Decide where history should live: dashboard section, separate tab/screen, or
   collapsible insight panel.
3. Add current-month spending by category from approved/purchased requests.
4. Add a simple monthly purchase history grouped by month.
5. Add approved, declined, buy-later, and postponed/requested counts in a
   decision-focused summary.
6. Add top categories by spend without implying full bank-account tracking.
7. Add empty and low-data states that explain insights need completed purchase
   decisions.
8. Verify compact Android-sized layouts and preview web if useful.

Definition of done:

- Completed Phase 19 checklist items are marked with `[x]` in
  `UX_FINANCE_ROADMAP_PHASE.md`.
- Users can see monthly purchase history and current-month category spend.
- Approved, declined, buy-later/postponed, and purchased decisions are
  summarized clearly.
- Insight copy stays focused on shared purchase decisions and budget confidence.
- Any new aggregation or presentation helpers have focused unit tests.
- No important text clips or overlaps at common Android viewport sizes.
- `npm.cmd run lint` passes or any remaining issue is documented.
- `npm.cmd test` passes or any remaining issue is documented.
