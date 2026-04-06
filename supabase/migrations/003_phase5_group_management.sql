create or replace function public.rename_group(target_group_id uuid, group_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  cleaned_name text := btrim(group_name);
  updated_group_id uuid;
begin
  if actor_id is null then
    raise exception 'You must be signed in to rename a group.';
  end if;

  if cleaned_name is null or char_length(cleaned_name) = 0 then
    raise exception 'Group name is required.';
  end if;

  update public.groups
  set name = cleaned_name
  where id = target_group_id
    and created_by = actor_id
  returning id into updated_group_id;

  if updated_group_id is null then
    raise exception 'Only the group creator can rename this group.';
  end if;

  return updated_group_id;
end;
$$;

create or replace function public.archive_group(target_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  archived_group_id uuid;
begin
  if actor_id is null then
    raise exception 'You must be signed in to archive a group.';
  end if;

  update public.groups
  set archived_at = timezone('utc', now())
  where id = target_group_id
    and created_by = actor_id
    and archived_at is null
  returning id into archived_group_id;

  if archived_group_id is null then
    raise exception 'Only the group creator can archive this group, or it is already archived.';
  end if;

  return archived_group_id;
end;
$$;

revoke all on function public.rename_group(uuid, text) from public;
revoke all on function public.archive_group(uuid) from public;

grant execute on function public.rename_group(uuid, text) to authenticated;
grant execute on function public.archive_group(uuid) to authenticated;
