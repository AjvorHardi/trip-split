create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  description text not null check (char_length(btrim(description)) between 1 and 160),
  amount_cents integer not null check (amount_cents > 0),
  payer_user_id uuid not null references public.profiles (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expense_participants (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  owed_cents integer not null check (owed_cents > 0),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (expense_id, user_id)
);

create index if not exists expenses_group_id_created_at_idx
  on public.expenses (group_id, created_at desc);

create index if not exists expense_participants_user_id_idx
  on public.expense_participants (user_id);

create or replace function public.set_expense_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists expenses_set_updated_at on public.expenses;

create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_expense_updated_at();

alter table public.expenses enable row level security;
alter table public.expense_participants enable row level security;

create or replace function public.is_expense_visible(target_expense_id uuid, viewer_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.expenses
    where expenses.id = target_expense_id
      and public.is_group_member(expenses.group_id, viewer_user_id)
  );
$$;

drop policy if exists "expenses_select_group_members" on public.expenses;
create policy "expenses_select_group_members"
on public.expenses
for select
to authenticated
using (
  public.is_group_member(group_id)
);

drop policy if exists "expense_participants_select_group_members" on public.expense_participants;
create policy "expense_participants_select_group_members"
on public.expense_participants
for select
to authenticated
using (
  public.is_expense_visible(expense_id)
);

create or replace function public.create_group_expense(
  target_group_id uuid,
  expense_description text,
  total_amount_cents integer,
  expense_payer_user_id uuid,
  expense_participant_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  cleaned_description text := btrim(expense_description);
  participant_count integer := coalesce(array_length(expense_participant_user_ids, 1), 0);
  distinct_participant_count integer;
  valid_participant_count integer;
  new_expense_id uuid;
begin
  if actor_id is null then
    raise exception 'You must be signed in to add an expense.';
  end if;

  if not public.is_group_member(target_group_id, actor_id) then
    raise exception 'Only group members can add expenses.';
  end if;

  if exists (
    select 1
    from public.groups
    where id = target_group_id
      and archived_at is not null
  ) then
    raise exception 'Archived groups cannot accept new expenses.';
  end if;

  if cleaned_description is null or char_length(cleaned_description) = 0 then
    raise exception 'Expense description is required.';
  end if;

  if total_amount_cents is null or total_amount_cents <= 0 then
    raise exception 'Expense amount must be greater than zero.';
  end if;

  if participant_count = 0 then
    raise exception 'Select at least one participant.';
  end if;

  select count(distinct participant_user_id)
  into distinct_participant_count
  from unnest(expense_participant_user_ids) as participant_user_id;

  if distinct_participant_count <> participant_count then
    raise exception 'Expense participants must be unique.';
  end if;

  if not public.is_group_member(target_group_id, expense_payer_user_id) then
    raise exception 'Payer must be a group member.';
  end if;

  select count(*)
  into valid_participant_count
  from public.group_members
  where group_id = target_group_id
    and user_id = any(expense_participant_user_ids);

  if valid_participant_count <> participant_count then
    raise exception 'All expense participants must belong to the group.';
  end if;

  insert into public.expenses (
    group_id,
    description,
    amount_cents,
    payer_user_id,
    created_by
  )
  values (
    target_group_id,
    cleaned_description,
    total_amount_cents,
    expense_payer_user_id,
    actor_id
  )
  returning id into new_expense_id;

  insert into public.expense_participants (expense_id, user_id, owed_cents)
  with participant_rows as (
    select participant_user_id, ordinality
    from unnest(expense_participant_user_ids) with ordinality as participants(participant_user_id, ordinality)
  )
  select
    new_expense_id,
    participant_rows.participant_user_id,
    (total_amount_cents / participant_count)
      + case
          when participant_rows.ordinality <= (total_amount_cents % participant_count) then 1
          else 0
        end
  from participant_rows;

  return new_expense_id;
end;
$$;

create or replace function public.update_group_expense(
  target_expense_id uuid,
  expense_description text,
  total_amount_cents integer,
  expense_payer_user_id uuid,
  expense_participant_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_group_id uuid;
  cleaned_description text := btrim(expense_description);
  participant_count integer := coalesce(array_length(expense_participant_user_ids, 1), 0);
  distinct_participant_count integer;
  valid_participant_count integer;
begin
  if actor_id is null then
    raise exception 'You must be signed in to update an expense.';
  end if;

  select group_id
  into target_group_id
  from public.expenses
  where id = target_expense_id
    and created_by = actor_id;

  if target_group_id is null then
    raise exception 'Only the expense creator can update this expense.';
  end if;

  if cleaned_description is null or char_length(cleaned_description) = 0 then
    raise exception 'Expense description is required.';
  end if;

  if total_amount_cents is null or total_amount_cents <= 0 then
    raise exception 'Expense amount must be greater than zero.';
  end if;

  if participant_count = 0 then
    raise exception 'Select at least one participant.';
  end if;

  select count(distinct participant_user_id)
  into distinct_participant_count
  from unnest(expense_participant_user_ids) as participant_user_id;

  if distinct_participant_count <> participant_count then
    raise exception 'Expense participants must be unique.';
  end if;

  if not public.is_group_member(target_group_id, expense_payer_user_id) then
    raise exception 'Payer must be a group member.';
  end if;

  select count(*)
  into valid_participant_count
  from public.group_members
  where group_id = target_group_id
    and user_id = any(expense_participant_user_ids);

  if valid_participant_count <> participant_count then
    raise exception 'All expense participants must belong to the group.';
  end if;

  update public.expenses
  set description = cleaned_description,
      amount_cents = total_amount_cents,
      payer_user_id = expense_payer_user_id
  where id = target_expense_id;

  delete from public.expense_participants
  where expense_id = target_expense_id;

  insert into public.expense_participants (expense_id, user_id, owed_cents)
  with participant_rows as (
    select participant_user_id, ordinality
    from unnest(expense_participant_user_ids) with ordinality as participants(participant_user_id, ordinality)
  )
  select
    target_expense_id,
    participant_rows.participant_user_id,
    (total_amount_cents / participant_count)
      + case
          when participant_rows.ordinality <= (total_amount_cents % participant_count) then 1
          else 0
        end
  from participant_rows;

  return target_expense_id;
end;
$$;

create or replace function public.delete_group_expense(target_expense_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  deleted_expense_id uuid;
begin
  if actor_id is null then
    raise exception 'You must be signed in to delete an expense.';
  end if;

  delete from public.expenses
  where id = target_expense_id
    and created_by = actor_id
  returning id into deleted_expense_id;

  if deleted_expense_id is null then
    raise exception 'Only the expense creator can delete this expense.';
  end if;

  return deleted_expense_id;
end;
$$;

revoke all on function public.create_group_expense(uuid, text, integer, uuid, uuid[]) from public;
revoke all on function public.update_group_expense(uuid, text, integer, uuid, uuid[]) from public;
revoke all on function public.delete_group_expense(uuid) from public;
revoke all on function public.is_expense_visible(uuid, uuid) from public;

grant execute on function public.create_group_expense(uuid, text, integer, uuid, uuid[]) to authenticated;
grant execute on function public.update_group_expense(uuid, text, integer, uuid, uuid[]) to authenticated;
grant execute on function public.delete_group_expense(uuid) to authenticated;
grant execute on function public.is_expense_visible(uuid, uuid) to authenticated;
