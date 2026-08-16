-- M19 · Add a 'seed' observation source (D-038). Seeded demo/estimate prices are
-- NOT real observations — they exist to make a new market usable before crowd data
-- arrives. Tagging them 'seed' keeps them distinct from human/scrape/feed/llm and
-- trivially purgeable (delete where source = 'seed') before a real launch.
--
-- Must be its own migration: a new enum value can't be used in the same
-- transaction that adds it — price_estimate references 'seed' in the next file.

alter type public.obs_source add value if not exists 'seed';
