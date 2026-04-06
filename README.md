# Trip-Split

Trip-Split is a practical MVP for shared trip and event expenses. The current build covers:

- public landing page
- email/password auth with Supabase
- protected app routes
- creating groups
- inviting members by email
- accepting pending invitations from the dashboard
- viewing group members and open invites

Expenses and balances are not implemented yet.

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

The app expects email/password auth and the phase-3 database schema.

1. In Supabase Auth, enable email/password sign-in.
2. For the current signup flow, disable email confirmation. The app currently expects Supabase to return a session immediately after signup.
3. Open the SQL Editor in your Supabase project.
4. Run the SQL from `supabase/migrations/001_phase3_groups_invites.sql`.

That SQL creates:

- `profiles`
- `groups`
- `group_members`
- `group_invites`
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

## Current assumptions

- Group invitations are visible in-app only.
- Any existing group member can invite another email.
- Group names are capped at 80 characters.
- Emails are normalized to lowercase in the database functions.
