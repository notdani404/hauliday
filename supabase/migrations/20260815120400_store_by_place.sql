-- M14 · Resolve/create a store from a Google Place (D-022 fast-follow). Dedups
-- globally on google_place_id (unique, M9); stores name + address + coords so the
-- observation ties to an exact branch — the foundation for "prices near you".

create or replace function public.find_or_create_store_by_place(
  p_retailer_id uuid,
  p_place_id    text,
  p_name        text,
  p_address     text default null,
  p_lat         double precision default null,
  p_lng         double precision default null
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_place text := nullif(trim(p_place_id), '');
  v_name  text := nullif(trim(p_name), '');
begin
  if v_place is null or v_name is null then
    return null;
  end if;
  select id into v_id from public.store where google_place_id = v_place limit 1;
  if v_id is not null then
    return v_id;
  end if;
  insert into public.store (retailer_id, name, google_place_id, address, lat, lng)
    values (p_retailer_id, v_name, v_place, nullif(trim(p_address), ''), p_lat, p_lng)
    returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.find_or_create_store_by_place(uuid, text, text, text, double precision, double precision)
  to authenticated;
