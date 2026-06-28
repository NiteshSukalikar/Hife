# Hife Roadmap And Phase Map

This roadmap is organized so each phase can be completed one by one. Every item starts as incomplete and can be updated as the application improves.

Status legend:

- `[ ]` Incomplete
- `[x]` Complete

## Phase 1: Product Cleanup And Foundation

Goal: Make the app clearly feel like a household purchase approval app instead of a generic ticket app.

- [x] Rename user-facing language from `Ticket` to `Purchase Request` or `Request`.
- [x] Rename `Explore` tab to `Create` or `New Request`.
- [x] Replace Expo starter README content with Hife-specific documentation.
- [x] Replace React logo usage in the header with Hife branding or a simple text-only header.
- [x] Fix corrupted UI characters such as `â`, `Â`, and broken currency symbols.
- [x] Use INR consistently across all screens.
- [x] Remove unused starter modal or replace it with a real Hife screen.
- [x] Add proper empty states for no requests and no comments.
- [x] Add loading and error states for request list, details, and comments.

## Phase 2: Core Purchase Request Flow

Goal: Build the main product loop from request creation to partner decision.

- [x] Update the request model to include product name, reason, expected price, max budget, category, and links.
- [x] Add structured product links instead of keeping links only inside comments.
- [x] Add request statuses: `pending`, `approved`, `declined`, `needs_more_info`, `buy_later`, `purchased`, and `cancelled`.
- [x] Add approve action.
- [x] Add decline action.
- [x] Add buy-later action.
- [x] Add ask-for-more-info action.
- [x] Add decision reason input.
- [x] Show request status clearly on the home screen.
- [x] Add status filters such as Pending, Approved, Declined, Buy Later, and Purchased.
- [x] Add a request detail screen that shows all purchase information clearly.
- [x] Add a mark-as-purchased action for approved requests.

## Phase 3: Image And Link Reliability

Goal: Make product images and product links reliable across both partners' devices.

- [x] Fix request image upload to save the Cloudinary `imageUrl` instead of local device URI.
- [x] Validate image size before upload.
- [x] Show image upload progress or loading state.
- [x] Add fallback UI when image upload fails.
- [x] Validate product links before saving.
- [x] Make product links tappable from request details.
- [x] Show source label for links such as Amazon, Flipkart, Meesho, or Other.
- [x] Allow multiple product links on one request.

## Phase 4: Partner And Household Model

Goal: Move from anonymous shared data to a real couple/household structure.

- [x] Add Firebase anonymous authentication.
- [x] Create a household collection.
- [x] Add household invite code generation.
- [x] Add join household by invite code.
- [x] Store household members.
- [x] Store each member's display name.
- [x] Add role labels such as Partner A and Partner B, or custom names.
- [x] Scope requests to the current household.
- [x] Scope comments to the current household.
- [x] Prevent users outside the household from reading or writing household data.

## Phase 5: Budget And Decision Intelligence

Goal: Help users make decisions based on money, priority, and monthly spending.

- [x] Add monthly household budget setting.
- [x] Add category-level budget setting.
- [x] Show current month approved total.
- [x] Show current month pending total.
- [x] Show remaining monthly budget.
- [x] Warn when a request exceeds available monthly budget.
- [x] Show simple budget impact on request details.
- [x] Add priority explanation text for P0, P1, P2, and P3.
- [x] Add spending history by month.
- [x] Add category summary such as Household, Electronics, Kitchen, Personal, Health, and Other.

## Phase 6: AI Decision Assistant

Goal: Add useful AI features that support household purchase decisions without increasing cost too much.

- [x] Add an `Ask AI` button on the create request screen.
- [x] Send title, reason, price, budget, priority, category, and recent spending to AI.
- [x] Return suggested priority.
- [x] Return recommendation: approve, decline, buy later, or need more info.
- [x] Return budget impact explanation.
- [x] Return short reasoning.
- [x] Return a polite suggested message for approval or decline.
- [x] Cache AI result in Firestore.
- [x] Show previously generated AI result instead of calling AI again.
- [x] Add monthly AI usage limit per household.
- [x] Add error handling for failed AI calls.
- [x] Make AI optional so the app still works without paid usage.

## Phase 7: Real-Time Collaboration And Notifications

Goal: Make the app feel shared and responsive between both partners.

- [x] Replace one-time Firestore reads with real-time listeners for requests.
- [x] Replace one-time Firestore reads with real-time listeners for comments.
- [x] Add unread comment count.
- [x] Add last activity timestamp.
- [x] Add local notification permission flow.
- [x] Add push notification when a new request is created.
- [x] Add push notification when a request is approved or declined.
- [x] Add push notification when a comment is added.
- [x] Add notification settings.

## Phase 8: UI And UX Polish

Goal: Make the app feel clean, calm, and purpose-built for repeated daily use.

- [x] Create a consistent color system.
- [x] Define black and neon green as the Hife brand theme.
- [x] Create Hife logo source artwork.
- [x] Create app thumbnail/favicon logo asset.
- [x] Create startup splash logo asset.
- [x] Apply black and neon green theme to primary app screens.
- [ ] Create priority chips with clear colors.
- [ ] Create status chips with clear colors.
- [ ] Improve request card layout.
- [ ] Improve create request form spacing and hierarchy.
- [ ] Add character counters where useful.
- [ ] Add better keyboard handling on mobile.
- [ ] Add clear primary and secondary buttons.
- [ ] Add confirmation dialogs for decline, cancel, and delete actions.
- [ ] Improve comment bubble design.
- [ ] Add accessible touch target sizes.
- [ ] Add dark mode polish or lock the app to light mode until dark mode is ready.

## Phase 9: Security, Rules, And Free-Tier Protection

Goal: Keep the app safe and affordable before real users use it.

- [x] Add Firebase security rules for households.
- [x] Add Firebase security rules for requests.
- [x] Add Firebase security rules for comments.
- [x] Validate user membership before write operations.
- [x] Restrict Cloudinary unsigned upload preset.
- [x] Restrict allowed image formats.
- [x] Restrict maximum upload size.
- [x] Avoid logging sensitive data.
- [x] Add basic abuse protection for AI calls.
- [x] Add read/write usage monitoring.
- [x] Document free-tier limits.

## Phase 10: Testing And Release Readiness

Goal: Make the app stable enough for personal or small private usage.

- [ ] Add basic unit tests for request helpers.
- [ ] Add basic unit tests for comment helpers.
- [ ] Add form validation tests.
- [ ] Test create request flow.
- [ ] Test approve and decline flow.
- [ ] Test image upload flow.
- [ ] Test comments flow.
- [ ] Test household invite flow.
- [ ] Test Android layout.
- [ ] Test iOS layout if available.
- [ ] Test web layout if web support is needed.
- [x] Update app icon and splash screen.
- [ ] Update production README.
- [ ] Create release checklist.

## Suggested Build Order

Recommended sequence:

1. Complete Phase 1.
2. Complete Phase 3 image fix early because it affects current functionality.
3. Complete Phase 2 core approval workflow.
4. Complete Phase 4 household model.
5. Complete Phase 5 budget intelligence.
6. Complete Phase 6 AI assistant.
7. Complete Phase 7 real-time and notifications.
8. Complete Phase 8 UI polish.
9. Complete Phase 9 security.
10. Complete Phase 10 testing and release readiness.

## Current Recommended Next Step

Start with:

- [x] Fix request image upload to save the Cloudinary `imageUrl` instead of local device URI.

This is the best first technical fix because it affects whether both partners can reliably see the uploaded product image.
