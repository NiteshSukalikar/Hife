# Hot Bug Fixes Phase

## Goal

Fix the mobile UX and room setup issues found during phone testing, then keep a
clear record of what changed and what still needs live verification.

## Reported Bugs And Fix Status

| Area | Reported issue | Fix status |
| --- | --- | --- |
| Header | Header/logo is cropped under the Android status bar. | Fixed: shared header now accounts for safe-area top spacing and uses room-based subtitle text. |
| Startup screen | Landing/startup page is too clustered. Only logo animation and bottom get-started action are needed. | Fixed: startup intro is now a simple animated logo, one short line, and bottom `Get started` button. |
| Room setup | Join does not explain where invite code comes from. | Fixed: after creating a room, the invite code is shown before entering the app. |
| Room setup | Create room should require a password so random users cannot join only by code. | Fixed: room creation requires a password; join requires invite code plus password; Firestore rules enforce the password during join. |
| Product language | `Household` feels too narrow for events or business use. | Fixed in main UI: setup and header now use `room`; default categories now include `Room`, `Event`, and `Office`. Internal Firestore collection names remain unchanged for compatibility. |
| Create request | Task max budget is editable, but it should come from the budget configured before task creation. | Fixed: create request now shows max budget as a disabled field derived from selected category and monthly remaining budget. |
| Dashboard | Category summary feels clustered on the dashboard. | Fixed: category summary is collapsed behind a Show/Hide control. |
| Categories | Categories should be editable/creatable per room/application/event. | Fixed: dashboard budget settings now allow adding custom categories, and those categories are available in request creation. |
| Budget setup | Max budget should be configured from dashboard first. | Fixed: request creation blocks when selected category/monthly budget leaves no available max budget. |

## Implementation Notes

- `components/header.tsx` now uses safe-area inset spacing.
- `components/startup-intro.tsx` was simplified into a lightweight animated intro.
- `app/household.tsx` now presents the product as a room setup flow and keeps the invite code visible after room creation.
- `services/households.js` now stores a room password on the room document and sends a password proof during join.
- `firestore.rules` now validates room password requirements and rejects direct join updates without the correct room password.
- `utils/budget.ts` and `services/budgets.js` now preserve custom category budgets instead of forcing only fixed categories.
- `app/(tabs)/index.tsx` now supports adding custom budget categories and hides category summary until requested.
- `app/(tabs)/explore.tsx` now derives the request max budget from configured budget instead of user input.

## Verification Checklist

- [ ] Create a room with room name, password, display name, and role.
- [ ] Confirm invite code and password are shown after room creation.
- [ ] Join from a second device with invite code and correct password.
- [ ] Confirm join fails with wrong password.
- [ ] Set monthly room budget and category budgets.
- [ ] Add a custom category and confirm it appears in request creation.
- [ ] Confirm request creation blocks when selected category has no available budget.
- [ ] Create request and confirm max budget field is disabled.
- [ ] Confirm dashboard category summary is collapsed by default.
- [ ] Confirm header is not cropped on Android devices with different status-bar heights.
- [ ] Confirm simplified startup intro is not visually crowded.

## Known Follow-Up

- Existing rooms created before this phase do not have a room password. Create a
  new room for password-protected join testing, or add a migration/update screen
  later for older rooms.
- Firestore rules must be deployed after this phase before the room password
  protection is active in Firebase.
