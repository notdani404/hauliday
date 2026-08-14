-- pgTAP tests for the ledger + price_estimate. Run with `supabase test db`.
--
-- Proves the roadmap's Phase 0 "done when": a correct, confidence-scored SG
-- estimate for a seeded JP variant, plus the zero-decimal and outlier cases and
-- the append-only guarantee.

begin;
select plan(11);

-- --- fixtures -------------------------------------------------------------
insert into auth.users (id) values
  ('f0000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000002'),
  ('f0000000-0000-0000-0000-000000000003'),
  ('f0000000-0000-0000-0000-000000000004'),
  ('f0000000-0000-0000-0000-000000000005');

insert into public.observer_trust (user_id, score, tier)
  values ('f0000000-0000-0000-0000-000000000001', 2.0, 'trusted');

insert into public.product (id, brand, name, category, form)
  values ('a0000000-0000-0000-0000-000000000001','Shiseido','Anessa Perfect UV','skincare','sunscreen');
insert into public.product_variant (id, product_id, market, size_value, size_unit, canonical_name)
  values ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','JP',60,'ml','Anessa Perfect UV 60ml (JP)');
insert into public.retailer (id, name, country, default_channel) values
  ('c0000000-0000-0000-0000-000000000001','Watsons','SG','in_store'),
  ('c0000000-0000-0000-0000-000000000002','Matsukiyo','JP','in_store');
insert into public.store (id, retailer_id, name)
  values ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Watsons ION');

-- SG in-store: four ~S$34.90 + one S$99.99 outlier
insert into public.observation
  (variant_id, retailer_id, store_id, channel, amount_minor, currency, tax_inclusive, source, observer_id, observed_on)
values
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','in_store',3490,'SGD',true,'human','f0000000-0000-0000-0000-000000000001',current_date),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','in_store',3500,'SGD',true,'human','f0000000-0000-0000-0000-000000000002',current_date),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','in_store',3480,'SGD',true,'human','f0000000-0000-0000-0000-000000000003',current_date),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','in_store',3510,'SGD',true,'human','f0000000-0000-0000-0000-000000000004',current_date),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','in_store',9999,'SGD',true,'human','f0000000-0000-0000-0000-000000000005',current_date);

-- superseded correction: old S$20.00 replaced by new S$34.90
insert into public.observation
  (id, variant_id, retailer_id, store_id, channel, amount_minor, currency, tax_inclusive, source, observer_id, observed_on)
values
  ('e0000000-0000-0000-0000-0000000000aa','b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','in_store',2000,'SGD',true,'human','f0000000-0000-0000-0000-000000000001',current_date-40);
insert into public.observation
  (variant_id, retailer_id, store_id, channel, amount_minor, currency, tax_inclusive, source, observer_id, observed_on, superseded_by)
values
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','in_store',3490,'SGD',true,'human','f0000000-0000-0000-0000-000000000001',current_date,'e0000000-0000-0000-0000-0000000000aa');

-- online obs at a very different price (must not blend)
insert into public.observation
  (variant_id, retailer_id, channel, amount_minor, currency, tax_inclusive, source, observed_on)
values
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','online',2000,'SGD',false,'feed',current_date);

-- JP in-store, zero-decimal JPY
insert into public.observation
  (variant_id, retailer_id, channel, amount_minor, currency, tax_inclusive, source, observer_id, observed_on)
values
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','in_store',1490,'JPY',true,'human','f0000000-0000-0000-0000-000000000002',current_date),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','in_store',1500,'JPY',true,'human','f0000000-0000-0000-0000-000000000003',current_date),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','in_store',1520,'JPY',true,'human','f0000000-0000-0000-0000-000000000004',current_date);

-- --- assertions -----------------------------------------------------------
-- SG in-store: outlier rejected, superseded excluded -> S$34.90 over 5 obs
select is((price_estimate('b0000000-0000-0000-0000-000000000001','SG','in_store')).amount_minor,
          3490::bigint, 'SG in-store estimate is S$34.90 (outlier + superseded excluded)');
select is((price_estimate('b0000000-0000-0000-0000-000000000001','SG','in_store')).currency,
          'SGD'::char(3), 'SG in-store estimate currency is SGD');
select is((price_estimate('b0000000-0000-0000-0000-000000000001','SG','in_store')).observation_count,
          5, 'SG in-store counts 5 surviving observations');
select is((price_estimate('b0000000-0000-0000-0000-000000000001','SG','in_store')).dominant_source,
          'human'::obs_source, 'SG in-store dominant source is human');
select cmp_ok((price_estimate('b0000000-0000-0000-0000-000000000001','SG','in_store')).confidence,
          '>', 0.7::numeric, 'SG in-store confidence is high (fresh, corroborated)');

-- channel separation: online estimate is its own number
select is((price_estimate('b0000000-0000-0000-0000-000000000001','SG','online')).amount_minor,
          2000::bigint, 'SG online estimate is S$20.00, never blended with in-store');
select is((price_estimate('b0000000-0000-0000-0000-000000000001','SG','online')).observation_count,
          1, 'SG online counts only the online observation');

-- zero-decimal JPY stored and estimated as whole yen
select is((price_estimate('b0000000-0000-0000-0000-000000000001','JP','in_store')).amount_minor,
          1500::bigint, 'JP in-store estimate is ¥1500 (zero-decimal, not 150000)');
select is((price_estimate('b0000000-0000-0000-0000-000000000001','JP','in_store')).currency,
          'JPY'::char(3), 'JP in-store estimate currency is JPY');

-- append-only ledger
select throws_ok(
  $$ update public.observation set amount_minor = 1 where currency = 'JPY' $$,
  'observation is append-only: UPDATE is not permitted',
  'UPDATE on observation is rejected');
select throws_ok(
  $$ delete from public.observation where currency = 'JPY' $$,
  'observation is append-only: DELETE is not permitted',
  'DELETE on observation is rejected');

select * from finish();
rollback;
