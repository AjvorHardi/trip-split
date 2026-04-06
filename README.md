# Trip-Split

Trip-Split is a practical MVP for shared trip and event expenses. The current build covers:

- public landing page
- email/password auth with Supabase
- protected app routes
- creating groups
- inviting members by email
- accepting pending invitations from the dashboard
- viewing group members and open invites
- adding, editing, and deleting your own shared expenses
- equal split balances inside each group

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` with:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Start the app:

```bash
npm run dev
```

## Supabase setup

The app expects email/password auth plus the phase-3 and phase-4 database schema.

1. In Supabase Auth, enable email/password sign-in.
2. For the current signup flow, disable email confirmation. The app currently expects Supabase to return a session immediately after signup.
3. Open the SQL Editor in your Supabase project.
4. Run the SQL from `supabase/migrations/001_phase3_groups_invites.sql`.
5. Run the SQL from `supabase/migrations/002_phase4_expenses.sql`.

That SQL creates:

- `profiles`
- `groups`
- `group_members`
- `group_invites`
- `expenses`
- `expense_participants`
- row-level security policies
- helper RPC functions used by the app

## Manual verification

After running the SQL:

1. Sign up with a fresh account.
2. Create a group from `/app/groups`.
3. Open the group page and invite another email.
4. Sign in with that invited email.
5. Accept the invite from the dashboard.
6. Confirm the accepted account can open the group page and see the member list.
7. Add an expense with one payer and multiple participants.
8. Confirm balances update on the group page.
9. Edit the expense as its creator.
10. Delete the expense as its creator.

## Current assumptions

- Group invitations are visible in-app only.
- Any existing group member can invite another email.
- Group names are capped at 80 characters.
- Emails are normalized to lowercase in the database functions.
- Expense amounts are stored as integer cents.
- Equal split remainders are distributed by participant selection order.
