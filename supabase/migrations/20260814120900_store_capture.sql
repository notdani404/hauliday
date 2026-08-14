-- M9 · Store-level capture (D-022). Tie an in-store observation to a specific
-- branch, not just a chain — the foundation for "prices near you" later.
--
-- Free-text now (name + area); Google Places fast-follow fills google_place_id +
-- address + lat/lng. find_or_create_store lets a contributor resolve/create a
-- store without a broad insert grant (SECURITY DEFINER, dedups by name+area).

alter table public.store add column if not exists google_place_id text unique;
alter table public.store add column if not exists area text;    -- neighbourhood, free-text
alter table public.store add column if not exists address text;  -- from Places, later

-- Resolve a store for a retailer by (name, area), creating it if new. Returns the
-- store id, or null for an empty name. Called at capture/sync time.
create or replace function public.find_or_create_store(
  p_retailer_id uuid,
  p_name        text,
  p_area        text default null
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_name text := nullif(trim(p_name), '');
  v_area text := nullif(trim(p_area), '');
begin
  if v_name is null then
    return null;
  end if;
  select id into v_id
    from public.store
   where retailer_id = p_retailer_id
     and lower(name) = lower(v_name)
     and coalesce(lower(area), '') = coalesce(lower(v_area), '')
   limit 1;
  if v_id is not null then
    return v_id;
  end if;
  insert into public.store (retailer_id, name, area)
    values (p_retailer_id, v_name, v_area)
    returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.find_or_create_store(uuid, text, text) to authenticated;
