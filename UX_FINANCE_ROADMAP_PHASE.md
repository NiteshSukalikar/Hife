# Hife UX And Finance Product Roadmap Phase

This roadmap converts the budgeting and personal-finance audit into a focused
execution checklist. Every item starts as incomplete so each change can be
picked, implemented, verified, and marked complete one by one.

Status legend:

- `[ ]` Incomplete
- `[x]` Complete

## Phase 11: Product Positioning And Money Clarity

Goal: Make Hife feel clearly like a shared purchase decision app with stronger
budgeting intelligence, not a generic task tracker or incomplete finance app.

- [x] Decide final product positioning: shared purchase decisions for couples,
  rooms, events, or households.
- [x] Update user-facing copy so the app does not overpromise full personal
  finance features before those features exist.
- [x] Add a clear value statement around the core question: "Can we safely buy
  this?"
- [x] Replace vague budget language with decision-focused money language such as
  safe to spend, remaining after approval, planned purchases, and committed
  spending.
- [x] Make the dashboard explain current financial state within the first screen.
- [x] Add product documentation describing the new positioning and decision
  model.

## Phase 12: Dashboard Redesign For Financial Confidence

Goal: Turn the home screen from a request inbox into a calm money decision
dashboard.

- [x] Reduce the visual height of the top brand/header area on mobile.
- [x] Move the most important money insight above the request list.
- [x] Add a safe-to-spend amount for the current month.
- [x] Show monthly budget, approved spend, pending spend, and remaining budget
  together.
- [x] Show category budget status without making the dashboard feel clustered.
- [x] Add simple budget health states such as Safe, Tight, Over Budget, and Needs
  Review.
- [x] Add a visual budget progress bar for monthly spending.
- [x] Add a visual budget progress bar for selected category spending.
- [x] Improve request cards so product names do not truncate too early.
- [x] Show amount, category, status, priority, and budget impact on each request
  card.
- [x] Add clearer empty states for no requests, no budget set, and no category
  budget set.

## Phase 13: Budget Model Upgrade

Goal: Add the finance structure needed to support real budget decisions.

- [ ] Add income setup for the room or household.
- [ ] Add committed monthly expense tracking.
- [ ] Add monthly budget rollover behavior or explicitly document that rollover
  is not supported.
- [ ] Add category-level remaining budget calculations.
- [ ] Add approved purchase totals by category.
- [ ] Add pending purchase totals by category.
- [ ] Add purchased totals by category.
- [ ] Add safe-to-spend calculation based on income, committed expenses, approved
  purchases, pending purchases, and savings reserve.
- [ ] Add a savings reserve or emergency buffer setting.
- [ ] Add warnings when a request would reduce safe-to-spend below zero.
- [ ] Add warnings when a request consumes too much of a category budget.

## Phase 14: Request Creation Flow Upgrade

Goal: Make request creation help users think clearly before asking for approval.

- [ ] Replace P0, P1, P2, and P3 labels with human urgency labels.
- [ ] Keep technical priority values internally only if needed for storage.
- [ ] Add need-by date or purchase timing.
- [ ] Add a "Can this wait?" field or decision prompt.
- [ ] Add replacement/upgrade/new purchase type.
- [ ] Show selected category budget while creating a request.
- [ ] Show remaining category budget while creating a request.
- [ ] Show projected remaining budget after the request amount.
- [ ] Add inline guidance when a request is above available budget.
- [ ] Make product image optional but visually polished when missing.
- [ ] Improve form spacing so fields feel premium and easy to scan.
- [ ] Add a final review step before submitting high-value requests.

## Phase 15: Request Details And Decision Flow

Goal: Make the details screen the central place for confident approval,
decline, postponement, and discussion.

- [ ] Replace the large black missing-image block with a polished neutral
  placeholder.
- [ ] Show budget before request, request amount, and budget after approval.
- [ ] Show category impact and monthly impact separately.
- [ ] Make approve, decline, buy later, and needs info actions equally clear.
- [ ] Require or encourage a decision reason for decline and buy later.
- [ ] Add a clear purchased state after approval.
- [ ] Add decision history with decision maker and timestamp.
- [ ] Add a summary card explaining why the request is safe, risky, or over
  budget.
- [ ] Keep discussion accessible without making it compete with primary decision
  actions.
- [ ] Improve sticky bottom action layout so it feels less cramped.

## Phase 16: Discussion And Partner Collaboration

Goal: Make partner discussion feel calm, contextual, and useful for money
decisions.

- [ ] Add a compact request summary at the top of the discussion screen.
- [ ] Show product price, status, and remaining budget while discussing.
- [ ] Improve comment input layout and send button clarity.
- [ ] Add link preview or link source display inside comments.
- [ ] Add image attachment display inside comments if supported.
- [ ] Add unread comments or new activity indicator.
- [ ] Add quick reply prompts such as "Can we wait?", "Approved", and "Need more
  info".
- [ ] Improve chat contrast so it feels premium, not heavy or unfinished.

## Phase 17: Onboarding And Setup Trust

Goal: Make first use reliable, clear, and trustworthy before users enter money
details.

- [ ] Fix blank or failed intro/setup screens.
- [ ] Add a short onboarding path that explains what Hife is for.
- [ ] Add room or household creation with clear naming.
- [ ] Explain how invite codes and passwords work.
- [ ] Add partner invite guidance after room creation.
- [ ] Add first monthly budget setup during onboarding.
- [ ] Add first category budget setup during onboarding.
- [ ] Add display name and role setup that feels human and editable.
- [ ] Add fallback/error states for setup failures.
- [ ] Verify onboarding on Android mobile dimensions.

## Phase 18: Premium Visual Design Pass

Goal: Make the app feel modern, trustworthy, and daily-use worthy.

- [ ] Choose one final brand palette and remove conflicting black/neon versus
  warm cream/clay documentation.
- [ ] Use display serif type only where it improves brand feel.
- [ ] Use clearer sans-serif hierarchy for financial data and form labels.
- [ ] Improve spacing consistency across cards, forms, chips, and bottom bars.
- [ ] Reduce visual heaviness on dark sections.
- [ ] Make status chips more scannable and consistent.
- [ ] Make financial values visually prominent without feeling loud.
- [ ] Ensure text never clips or truncates key decision information.
- [ ] Improve touch target consistency for filters, chips, buttons, and tabs.
- [ ] Verify all screens at common Android viewport sizes.
- [ ] Verify all screens on web if web support remains part of the product.

## Phase 19: Finance Insights And History

Goal: Help users understand habits over time, not only one purchase at a time.

- [ ] Add monthly purchase history.
- [ ] Add spending by category for the current month.
- [ ] Add spending by category for past months.
- [ ] Add approved versus declined request counts.
- [ ] Add postponed request tracking.
- [ ] Add top categories by spend.
- [ ] Add simple month-over-month comparison.
- [ ] Add recurring purchase detection or manual recurring labels.
- [ ] Add export or summary view if users need monthly review outside the app.

## Phase 20: Verification And Release Quality

Goal: Confirm the redesigned experience works as a real money product before
private use.

- [ ] Test the full flow from onboarding to budget setup to request creation.
- [ ] Test approve, decline, buy later, needs info, and purchased states.
- [ ] Test budget calculations with no income, no budget, over-budget, and exact
  budget cases.
- [ ] Test category budgets with custom categories.
- [ ] Test dashboard readability with many requests.
- [ ] Test dashboard readability with no requests.
- [ ] Test long product names, large INR amounts, and long decision reasons.
- [ ] Test image missing, image loading, and image upload failed states.
- [ ] Test comments with long messages and links.
- [ ] Run lint.
- [ ] Run unit tests.
- [ ] Add or update tests for safe-to-spend and budget impact calculations.
- [ ] Capture screenshots after each completed phase for visual comparison.

## Recommended Build Order

1. Complete Phase 11 product positioning and money clarity.
2. Complete Phase 13 budget model upgrade enough to support safe-to-spend.
3. Complete Phase 12 dashboard redesign.
4. Complete Phase 14 request creation flow upgrade.
5. Complete Phase 15 request details and decision flow.
6. Complete Phase 17 onboarding and setup trust.
7. Complete Phase 16 discussion and partner collaboration.
8. Complete Phase 18 premium visual design pass.
9. Complete Phase 19 finance insights and history.
10. Complete Phase 20 verification and release quality.

## Current Recommended Next Step

Start with:

- [x] Add a safe-to-spend amount for the current month.

This is the highest-impact first change because it directly answers the main
user question: "Can we safely buy this?"
