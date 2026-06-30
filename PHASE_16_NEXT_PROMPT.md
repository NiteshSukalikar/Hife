# Prompt For Next Phase: Phase 16 Discussion And Partner Collaboration

You are working in `S:\Other\Hife` on the Hife Expo/React Native app.

Phase 15 is complete. The request details screen now has a compact neutral
missing-image placeholder, a safe-to-spend decision summary, separate monthly
and category impact sections, clearer approve/decline/buy-later/needs-info
actions, decision reason guidance, a purchased state, decision history, and a
low-competition discussion entry point.

Start Phase 16 from `UX_FINANCE_ROADMAP_PHASE.md`.

Primary objective:

Make request discussion feel calm, contextual, and useful for shared money
decisions without competing with the approval controls on the details screen.

Important constraints:

- Preserve Firestore compatibility for old and new request and comment
  documents.
- Keep safe-to-spend and request amount visible as discussion context.
- Keep status and urgency labels human-readable; do not show raw priority
  P-codes in user-facing copy.
- Keep comments focused on purchase decisions, timing, budget risk, and missing
  information.
- Do not turn the comments screen into the primary approval surface unless the
  existing details-screen decision flow remains intact.
- Use calm, specific, decision-focused UI language.
- Add focused tests for any new presentation, summary, quick-reply, or comment
  helper.
- Run `npm.cmd run lint` and `npm.cmd test` before committing.

Recommended first tasks:

1. Add a compact request summary at the top of the comments screen.
2. Show product price, status, urgency, and safe-to-spend context while
   discussing.
3. Improve comment input layout and send button clarity on mobile.
4. Add link source display or a simple link preview inside comments when URLs are
   present.
5. Add quick reply prompts such as "Can we wait?", "Approved", and "Need more
   info" without making them noisy.
6. Add unread/new activity or last-comment context if it fits the existing data
   model.
7. Improve chat contrast so the screen feels premium, not heavy or unfinished.
8. Verify long comments, long product names, missing images, and older request
   documents.

Definition of done:

- Completed Phase 16 checklist items are marked with `[x]` in
  `UX_FINANCE_ROADMAP_PHASE.md`.
- Discussion screen includes compact request, price, status, and budget context.
- Comment composer is clear, mobile-friendly, and does not overlap content.
- Quick replies or prompts help decision-making without taking over the screen.
- Old request and comment documents still render correctly.
- `npm.cmd run lint` passes or any remaining issue is documented.
- `npm.cmd test` passes or any remaining issue is documented.
