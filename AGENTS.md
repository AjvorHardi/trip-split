# Trip-Split agent instructions

## Project goal
Build a practical MVP web app called Trip-Split, a shared expense tracker for trips and events.

## Product brief
Trip-Split lets users sign up, create groups, invite people by email, add shared expenses, and view balances within each group. Users should only see groups they belong to. The app should feel practical, clean, and easy to use in real situations.

## Stack
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Supabase
- No separate Node backend for MVP unless explicitly requested later

## MVP rules
- Email/password auth only
- Persisted sessions
- Public landing page
- Protected app routes
- Users can create groups
- Users can invite by email
- Show pending invitations inside the app
- No email delivery yet
- Expenses include:
  - description
  - amount
  - payer
  - selected participants
- Store money as integer cents
- Equal split only
- One payer per expense
- Group page shows members, expenses, and balances
- Users only see groups they belong to
- Use Supabase row-level security
- No payment processing
- No multicurrency
- No recurring expenses
- No mobile app

## Product decisions
- Invite people by email even if they have not registered yet
- Pending invites should be visible in the app
- All group members can view group data
- All group members can add expenses
- Only the expense creator can edit or delete their own expense
- Only the group creator can rename or archive the group
- Keep the schema simple and explicit
- Avoid premature abstractions

## Engineering rules
- Before large edits, propose a short implementation plan
- For new features, prefer the smallest working version first
- Keep files tidy and names predictable
- Do not add unnecessary libraries
- Add comments only where they genuinely help
- Avoid placeholder demo content in final code
- Prefer readable code over clever code

## Suggested folder direction
- src/components
- src/pages
- src/features
- src/lib
- src/hooks
- src/types
- supabase/migrations

## What done means
A feature is only done when:
- It works locally
- It matches the MVP rules
- It does not break auth or routing
- Basic edge cases are handled
- Setup instructions are updated if needed

## Workflow rules
- First help define architecture if asked
- Do not build everything at once unless explicitly asked
- Break work into phases:
  1. architecture
  2. auth
  3. groups and invites
  4. expenses and balances
  5. polish and cleanup

## When uncertain
If requirements are ambiguous, point out the ambiguity and propose the simplest MVP-safe assumption.