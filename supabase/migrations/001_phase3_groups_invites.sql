create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (group_id, user_id)
);

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  email text not null,
  invited_by uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists group_invites_one_pending_per_email
  on public.group_invites (group_id, email)
  where status = 'pending';

create index if not exists group_members_user_id_idx
  on public.group_members (user_id);

create index if not exists group_invites_email_idx
  on public.group_invites (email);

create or replace function public.handle_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;

create trigger on_auth_user_profile_sync
after insert or update of email on auth.users
for each row
execute function public.handle_profile_sync();

insert into public.profiles (id, email)
select users.id, lower(users.email)
from auth.users as users
where users.email is not null
on conflict (id) do update
set email = excluded.email;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;

create or replace function public.is_group_member(target_group_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_members.group_id = target_group_id
      and group_members.user_id = target_user_id
  );
$$;

create or replace function public.share_group_with_profile(target_profile_id uuid, viewer_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members as viewer_membership
    join public.group_members as target_membership
      on target_membership.group_id = viewer_membership.group_id
    where viewer_membership.user_id = viewer_user_id
      and target_membership.user_id = target_profile_id
  );
$$;

drop policy if exists "profiles_select_shared_group" on public.profiles;
create policy "profiles_select_shared_group"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.share_group_with_profile(id)
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "groups_select_members_only" on public.groups;
create policy "groups_select_members_only"
on public.groups
for select
to authenticated
using (
  public.is_group_member(id)
);

drop policy if exists "groups_update_creator_only" on public.groups;
create policy "groups_update_creator_only"
on public.groups
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "group_members_select_same_group" on public.group_members;
create policy "group_members_select_same_group"
on public.group_members
for select
to authenticated
using (
  public.is_group_member(group_id)
);

drop policy if exists "group_invites_select_group_members" on public.group_invites;
create policy "group_invites_select_group_members"
on public.group_invites
for select
to authenticated
using (
  public.is_group_member(group_id)
);

create or replace function public.create_group_with_creator_membership(group_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  cleaned_name text := btrim(group_name);
  new_group_id uuid;
begin
  if actor_id is null then
    raise exception 'You must be signed in to create a group.';
  end if;

  if cleaned_name is null or char_length(cleaned_name) = 0 then
    raise exception 'Group name is required.';
  end if;

  insert into public.groups (name, created_by)
  values (cleaned_name, actor_id)
  returning id into new_group_id;

  insert into public.group_members (group_id, user_id)
  values (new_group_id, actor_id);

  return new_group_id;
end;
$$;

create or replace function public.invite_to_group(target_group_id uuid, invite_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  cleaned_email text := lower(btrim(invite_email));
  existing_pending_invite_id uuid;
  new_invite_id uuid;
begin
  if actor_id is null then
    raise exception 'You must be signed in to invite someone.';
  end if;

  if cleaned_email is null or cleaned_email = '' then
    raise exception 'Invite email is required.';
  end if;

  if not exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = actor_id
  ) then
    raise exception 'Only group members can send invitations.';
  end if;

  if exists (
    select 1
    from public.groups
    where id = target_group_id
      and archived_at is not null
  ) then
    raise exception 'Archived groups cannot accept new invitations.';
  end if;

  if exists (
    select 1
    from public.group_members
    join public.profiles on profiles.id = group_members.user_id
    where group_members.group_id = target_group_id
      and profiles.email = cleaned_email
  ) then
    raise exception 'That email already belongs to a group member.';
  end if;

  select id
  into existing_pending_invite_id
  from public.group_invites
  where group_id = target_group_id
    and email = cleaned_email
    and status = 'pending'
  limit 1;

  if existing_pending_invite_id is not null then
    return existing_pending_invite_id;
  end if;

  insert into public.group_invites (group_id, email, invited_by)
  values (target_group_id, cleaned_email, actor_id)
  returning id into new_invite_id;

  return new_invite_id;
end;
$$;

create or replace function public.accept_group_invite(target_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text;
  invite_record public.group_invites%rowtype;
begin
  if actor_id is null then
    raise exception 'You must be signed in to accept an invitation.';
  end if;

  select email
  into actor_email
  from public.profiles
  where id = actor_id;

  if actor_email is null then
    raise exception 'Your profile is missing. Sign out and sign back in, then try again.';
  end if;

  select *
  into invite_record
  from public.group_invites
  where id = target_invite_id
    and status = 'pending';

  if invite_record.id is null then
    raise exception 'Invitation not found.';
  end if;

  if invite_record.email <> actor_email then
    raise exception 'This invitation belongs to a different email address.';
  end if;

  insert into public.group_members (group_id, user_id)
  values (invite_record.group_id, actor_id)
  on conflict (group_id, user_id) do nothing;

  update public.group_invites
  set status = 'accepted',
      accepted_by = actor_id,
      accepted_at = timezone('utc', now())
  where id = invite_record.id;

  return invite_record.group_id;
end;
$$;

create or replace function public.list_pending_group_invites()
returns table (
  invite_id uuid,
  group_id uuid,
  group_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text;
begin
  if actor_id is null then
    return;
  end if;

  select email
  into actor_email
  from public.profiles
  where id = actor_id;

  if actor_email is null then
    return;
  end if;

  return query
  select invites.id, groups.id, groups.name, invites.created_at
  from public.group_invites as invites
  join public.groups on groups.id = invites.group_id
  where invites.email = actor_email
    and invites.status = 'pending'
  order by invites.created_at desc;
end;
$$;

revoke all on function public.create_group_with_creator_membership(text) from public;
revoke all on function public.invite_to_group(uuid, text) from public;
revoke all on function public.accept_group_invite(uuid) from public;
revoke all on function public.list_pending_group_invites() from public;
revoke all on function public.is_group_member(uuid, uuid) from public;
revoke all on function public.share_group_with_profile(uuid, uuid) from public;

grant execute on function public.create_group_with_creator_membership(text) to authenticated;
grant execute on function public.invite_to_group(uuid, text) to authenticated;
grant execute on function public.accept_group_invite(uuid) to authenticated;
grant execute on function public.list_pending_group_invites() to authenticated;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.share_group_with_profile(uuid, uuid) to authenticated;
