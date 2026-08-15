-- M17 · Free-text retailer fallback (D-035). A contributor can't be stranded when
-- a market has no seeded retailers: they type the chain they saw and we resolve or
-- create it at sync time — mirroring find_or_create_store, so no broad insert grant
-- is handed to clients (SECURITY DEFINER, dedups by lower(name)+country).

create or replace function public.find_or_create_retailer(
  p_name    text,
  p_country char(2),
  p_channel public.channel default 'in_store'
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_name    text := nullif(trim(p_name), '');
  v_country char(2) := upper(p_country);
begin
  if v_name is null then
    return null;
  end if;
  select id into v_id
    from public.retailer
   where lower(name) = lower(v_name)
     and country = v_country
   limit 1;
  if v_id is not null then
    return v_id;
  end if;
  insert into public.retailer (name, country, default_channel)
    values (v_name, v_country, p_channel)
    returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.find_or_create_retailer(text, char, public.channel) to authenticated;
