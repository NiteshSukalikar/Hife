# Hife Application Workflow

## Purpose

Hife is a shared purchase decision app for couples, rooms, and small groups. The main idea is simple: before someone buys something, they create a request with the item details, budget context, priority, image, and product links. The other person can review the request, understand whether it is safe to buy, discuss it, and decide whether to approve, decline, postpone, or ask for more information.

The app is currently an early prototype. It already supports creating requests, adding priority and budget, attaching images, listing requests, viewing request details, and discussing requests through comments. The long-term product direction should move from a generic task/ticket app toward a clear purchase approval workflow.

The visual identity is warm, premium, and calm. The theme is documented in `BRAND_THEME.md`, with logo assets stored under `assets/brand` and `assets/images`.

## Target Users

- Partners managing shared purchases together.
- Couples who want to avoid impulsive spending.
- Roommates, families, events, or small teams that need a shared purchase approval flow.
- People who want transparency around budget, priority, and purchase reasoning.
- Groups that want calmer money conversations before buying items.

## Current Workflow

1. A user opens the app.
2. The home screen shows existing requests.
3. The user can create a new request from the second tab.
4. The request includes:
   - Title
   - Description/info
   - Priority: P0, P1, P2, or P3
   - Budget amount
   - Optional image
5. The request is saved to Firebase Firestore.
6. The request appears in the list.
7. A user can open details for the request.
8. A user can open comments for the request.
9. In comments, users can discuss the item, add links, and attach images.

## Product Positioning

Hife should be positioned as a shared purchase decision app with budget
confidence. It should not present itself as a full personal finance or banking
replacement until it has income setup, committed expense tracking, savings
buffers, and deeper spending analytics.

The core promise is:

Can we safely buy this without creating stress later?

The product should answer this using:

- Current monthly budget
- Approved spend
- Pending spend
- Category budget
- Remaining budget after approval
- Decision status and partner discussion

## Intended Future Workflow

1. Partner A creates a purchase request.
2. The request includes structured purchase details:
   - Product name
   - Reason for purchase
   - Expected price
   - Maximum acceptable budget
   - Product links such as Amazon or Flipkart
   - Priority
   - Category
   - Image
3. Partner B receives or sees the pending request.
4. Partner B reviews:
   - Price vs budget
   - Priority
   - Reason for purchase
   - Product link
   - Previous household spending
5. Partner B chooses one action:
   - Approve
   - Decline
   - Buy later
   - Ask for more details
6. The app stores the decision, reason, timestamp, and decision maker.
7. If approved, the request can move into a follow-up state such as:
   - To buy
   - Purchased
   - Cancelled
8. The couple can review monthly purchase history and budget impact.

## Recommended Status Model

The current app uses `open`, but the product needs a richer status flow.

Recommended statuses:

- `draft`: Created but not submitted.
- `pending`: Waiting for partner decision.
- `approved`: Partner approved the request.
- `declined`: Partner declined the request.
- `needs_more_info`: Partner requested clarification.
- `buy_later`: Valid request, but postponed.
- `purchased`: Item has been bought.
- `cancelled`: Request was cancelled by the creator.

## Recommended Priority Model

Current priorities are P0 to P3.

Suggested meaning:

- `P0`: Emergency or must buy immediately.
- `P1`: Important, should be decided within 24 hours.
- `P2`: Useful, can wait a few days.
- `P3`: Nice to have, low urgency.

## Main Product Gaps

- The app still needs a stronger safe-to-spend model.
- Income, committed expenses, and savings buffers are not modeled yet.
- The dashboard needs to explain money confidence faster.
- Priority labels such as P0/P1/P2/P3 are still too technical for normal users.
- Missing images and blank setup states need more trustworthy presentation.
- Monthly and category insights need to feel more like finance guidance, not only request history.

## AI Feature Ideas

AI should help users make better household purchase decisions, not just add decoration.

Useful AI features:

- Suggest priority based on reason, price, and urgency.
- Recommend approve, decline, or buy later.
- Explain budget impact in simple language.
- Generate a polite approval or decline message.
- Detect similar previous purchase requests.
- Summarize monthly spending behavior.

Recommended first AI feature:

`AI Decision Assistant`

It should read the request title, description, price, priority, budget, and recent spending, then return:

- Suggested priority
- Recommendation
- Budget impact
- Reasoning
- Suggested message for partner

## Free-Tier Product Strategy

Because the app is currently intended to stay free or very low cost:

- Use Firebase Firestore carefully with simple reads and writes.
- Avoid automatic AI calls on every screen load.
- Add an explicit `Ask AI` button.
- Cache AI results in Firestore.
- Limit AI usage per household per month.
- Keep product link parsing manual at first.
- Use Cloudinary free tier carefully and restrict upload settings.
- Add Firebase security rules before any real usage.

## Ideal Version 1 Goal

The next strong version should focus on one complete loop:

Create purchase request -> partner reviews -> approve/decline/buy later -> discuss -> mark purchased.

If this loop feels clear, fast, and trustworthy, the application will become much more useful even before advanced AI or analytics are added.
