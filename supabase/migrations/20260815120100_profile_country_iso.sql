-- M11 · profile.country becomes an ISO alpha-2 code (the user's home market),
-- consistent with product_variant.market / retailer.country. Was free text;
-- normalise any non-2-char values to null, tighten the type, and constrain to
-- uppercase 2-letter codes. The selectable set is the app's HOME_MARKETS enum;
-- this column stores the chosen code and drives home-market comparisons.

update public.profile set country = null
  where country is not null and char_length(country) <> 2;

alter table public.profile
  alter column country type char(2) using upper(country)::char(2);

alter table public.profile
  add constraint profile_country_iso
  check (country is null or (char_length(country) = 2 and country = upper(country)));
