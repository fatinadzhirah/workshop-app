-- ════════════════════════════════════════════════════════════════
-- FoodFat — food ordering schema (Module 5)
-- Run this ONCE in your Supabase project's SQL editor.
-- Safe to re-run by accident: every statement is guarded and the
-- seed data uses "on conflict do nothing".
-- Contains NO destructive statements (no drop / truncate / delete).
--
-- The big idea: the MENU is public to read and impossible to write
-- from the browser. ORDERS are readable only by their owner and are
-- never inserted by the browser at all — checkout goes through the
-- place_order() function below, which re-reads prices from the
-- database. A tampered client cannot buy a burger for 1 sen.
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1) THE KITCHEN — public, read-only from the app
-- ────────────────────────────────────────────────────────────────

-- One row, always. `id boolean primary key check (id)` is the classic
-- "singleton table" trick: only the value true fits, so a second row
-- is impossible.
create table if not exists public.restaurant_settings (
  id                 boolean primary key default true check (id),
  delivery_fee_cents integer not null default 500  check (delivery_fee_cents >= 0),
  min_order_cents    integer not null default 1000 check (min_order_cents >= 0),
  is_open            boolean not null default true
);

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  slug       text not null unique,
  sort_order integer not null default 0
);

create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete restrict,
  name         text not null check (char_length(name) between 1 and 120),
  slug         text not null unique,
  description  text check (description is null or char_length(description) <= 400),
  emoji        text not null default '🍽️',
  price_cents  integer not null check (price_cents >= 0),
  -- Dishes are never deleted — sold out or retired means is_available = false,
  -- so past orders that point at them keep working.
  is_available boolean not null default true,
  sort_order   integer not null default 0
);

create index if not exists menu_items_category_idx
  on public.menu_items (category_id, sort_order);

-- ────────────────────────────────────────────────────────────────
-- 2) ORDERS — one row per checkout, owned by exactly one user
-- ────────────────────────────────────────────────────────────────

create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  status             text not null default 'pending'
                       check (status in ('pending','confirmed','preparing',
                                         'ready','completed','cancelled')),
  fulfilment_type    text not null check (fulfilment_type in ('pickup','delivery')),
  phone              text not null check (char_length(phone) between 6 and 30),
  address            text check (address is null or char_length(address) <= 400),
  notes              text check (notes is null or char_length(notes) <= 500),
  subtotal_cents     integer not null default 0 check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  total_cents        integer not null default 0 check (total_cents >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- A delivery order has an address; a pickup order never does.
  constraint orders_address_matches_fulfilment
    check ((fulfilment_type = 'delivery') = (address is not null)),
  -- The total is always the sum of its parts — no room for a stray number.
  constraint orders_total_adds_up
    check (total_cents = subtotal_cents + delivery_fee_cents)
);

-- Speeds up "list MY orders, newest first" — exactly what /app does.
create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

-- Each line SNAPSHOTS the dish: name, emoji and price as they were at
-- checkout. Editing the menu tomorrow never rewrites yesterday's receipt.
-- menu_item_id is kept (nullable) only so "Order again" can find the dish.
create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  menu_item_id     uuid references public.menu_items (id) on delete set null,
  name_at_order    text not null,
  emoji_at_order   text not null default '🍽️',
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity between 1 and 20),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create index if not exists order_items_order_idx
  on public.order_items (order_id);

-- ────────────────────────────────────────────────────────────────
-- 3) FAVOURITES — the hearts on the menu
-- ────────────────────────────────────────────────────────────────

create table if not exists public.favourites (
  user_id      uuid not null references auth.users (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, menu_item_id)
);

-- ────────────────────────────────────────────────────────────────
-- 4) ROW LEVEL SECURITY
--    The DATABASE decides who sees what. Even a modified app or a
--    direct API call cannot cross users. No policy = no access.
-- ────────────────────────────────────────────────────────────────

alter table public.restaurant_settings enable row level security;
alter table public.categories          enable row level security;
alter table public.menu_items          enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.favourites          enable row level security;

do $$
begin
  -- ── The menu: anyone may READ, nobody may write ────────────────
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'restaurant_settings' and policyname = 'settings_read_all') then
    create policy settings_read_all on public.restaurant_settings
      for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'categories' and policyname = 'categories_read_all') then
    create policy categories_read_all on public.categories
      for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'menu_items' and policyname = 'menu_items_read_all') then
    create policy menu_items_read_all on public.menu_items
      for select using (true);
  end if;

  -- ── Orders: read your own, and that is ALL ─────────────────────
  -- There is deliberately no insert / update / delete policy here.
  -- Placing and cancelling go through place_order() / cancel_order().
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'orders' and policyname = 'orders_select_own') then
    create policy orders_select_own on public.orders
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'order_items' and policyname = 'order_items_select_own') then
    create policy order_items_select_own on public.order_items
      for select using (
        exists (select 1 from public.orders o
                where o.id = order_items.order_id and o.user_id = auth.uid())
      );
  end if;

  -- ── Favourites: yours to add and remove (no money involved) ────
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'favourites' and policyname = 'favourites_select_own') then
    create policy favourites_select_own on public.favourites
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'favourites' and policyname = 'favourites_insert_own') then
    create policy favourites_insert_own on public.favourites
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'favourites' and policyname = 'favourites_delete_own') then
    create policy favourites_delete_own on public.favourites
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 5) Keep updated_at fresh whenever an order changes.
-- ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────
-- 6) CHECKOUT — the only way an order is ever created.
--
--    The browser sends dish ids and quantities. Never prices.
--    This function looks every price up itself, so the receipt is
--    computed by Postgres and cannot be argued with by the client.
-- ────────────────────────────────────────────────────────────────

create or replace function public.place_order(
  p_items      jsonb,
  p_fulfilment text,
  p_phone      text,
  p_address    text default null,
  p_notes      text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user         uuid    := auth.uid();
  v_fulfilment   text    := lower(trim(coalesce(p_fulfilment, '')));
  v_phone        text    := trim(coalesce(p_phone, ''));
  v_address      text    := nullif(trim(coalesce(p_address, '')), '');
  v_notes        text    := nullif(trim(coalesce(p_notes, '')), '');
  v_delivery_fee integer := 0;
  v_fee_setting  integer;
  v_min_order    integer;
  v_is_open      boolean;
  v_subtotal     integer;
  v_order_id     uuid;
begin
  if v_user is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  if v_fulfilment not in ('pickup', 'delivery') then
    raise exception 'Choose pickup or delivery.';
  end if;

  if char_length(v_phone) < 6 or char_length(v_phone) > 30 then
    raise exception 'Please give a contact phone number.';
  end if;

  if v_fulfilment = 'delivery' and v_address is null then
    raise exception 'Please give a delivery address.';
  end if;

  -- A pickup order never keeps an address, whatever the client sent.
  if v_fulfilment = 'pickup' then
    v_address := null;
  end if;

  -- Two separate checks on purpose: jsonb_array_length() errors on anything
  -- that isn't an array, so the shape must be settled before we measure it.
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Your cart is empty.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  select s.delivery_fee_cents, s.min_order_cents, s.is_open
    into v_fee_setting, v_min_order, v_is_open
  from public.restaurant_settings s
  where s.id;

  if not coalesce(v_is_open, true) then
    raise exception 'The kitchen is closed right now. Please try again later.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as line
    where coalesce((line->>'quantity')::integer, 0) not between 1 and 20
  ) then
    raise exception 'Each dish needs a quantity between 1 and 20.';
  end if;

  -- Anything the menu does not currently sell stops the whole order.
  if exists (
    select 1
    from jsonb_array_elements(p_items) as line
    where not exists (
      select 1 from public.menu_items m
      where m.id = (line->>'menu_item_id')::uuid
        and m.is_available
    )
  ) then
    raise exception 'One of those dishes is no longer available. Refresh the menu and try again.';
  end if;

  insert into public.orders (user_id, status, fulfilment_type, phone, address, notes)
  values (v_user, 'pending', v_fulfilment, v_phone, v_address, v_notes)
  returning id into v_order_id;

  -- Prices come from menu_items — the JSON only ever supplies quantities.
  -- Duplicate ids in the cart are summed rather than rejected.
  insert into public.order_items (
    order_id, menu_item_id, name_at_order, emoji_at_order,
    unit_price_cents, quantity, line_total_cents
  )
  select v_order_id, m.id, m.name, m.emoji,
         m.price_cents, wanted.quantity, m.price_cents * wanted.quantity
  from (
    select (line->>'menu_item_id')::uuid as menu_item_id,
           sum((line->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as line
    group by 1
  ) as wanted
  join public.menu_items m on m.id = wanted.menu_item_id;

  select coalesce(sum(oi.line_total_cents), 0)
    into v_subtotal
  from public.order_items oi
  where oi.order_id = v_order_id;

  if v_subtotal < coalesce(v_min_order, 0) then
    raise exception 'Your order is below the minimum order amount.';
  end if;

  if v_fulfilment = 'delivery' then
    v_delivery_fee := coalesce(v_fee_setting, 0);
  end if;

  update public.orders
     set subtotal_cents     = v_subtotal,
         delivery_fee_cents = v_delivery_fee,
         total_cents        = v_subtotal + v_delivery_fee
   where id = v_order_id;

  return v_order_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────
-- 7) CANCELLING — allowed only while the kitchen hasn't started.
--    This is why orders needs no UPDATE policy: the only permitted
--    change goes through here.
-- ────────────────────────────────────────────────────────────────

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rows integer;
begin
  if v_user is null then
    raise exception 'You must be signed in to cancel an order.';
  end if;

  update public.orders
     set status = 'cancelled'
   where id = p_order_id
     and user_id = v_user
     and status = 'pending';

  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    raise exception 'That order can no longer be cancelled.';
  end if;
end;
$$;

-- Only signed-in users may call these. (Postgres grants EXECUTE to
-- everyone by default, so revoke first.)
revoke execute on function public.place_order(jsonb, text, text, text, text) from public;
revoke execute on function public.cancel_order(uuid) from public;
grant  execute on function public.place_order(jsonb, text, text, text, text) to authenticated;
grant  execute on function public.cancel_order(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────
-- 8) SEED — the starting menu. Re-running changes nothing.
-- ────────────────────────────────────────────────────────────────

insert into public.restaurant_settings (id, delivery_fee_cents, min_order_cents, is_open)
values (true, 500, 1000, true)
on conflict (id) do nothing;

insert into public.categories (name, slug, sort_order) values
  ('Starters', 'starters',  1),
  ('Mains',    'mains',     2),
  ('Sides',    'sides',     3),
  ('Desserts', 'desserts',  4),
  ('Drinks',   'drinks',    5)
on conflict (slug) do nothing;

insert into public.menu_items (category_id, name, slug, description, emoji, price_cents, sort_order)
select c.id, v.name, v.slug, v.description, v.emoji, v.price_cents, v.sort_order
from (values
  ('starters', 'Roti Canai',        'roti-canai',        'Flaky griddled flatbread with dhal and sambal.',            '🫓',  350, 1),
  ('starters', 'Chicken Satay (6)', 'chicken-satay',     'Charcoal-grilled skewers with peanut sauce.',               '🍢', 1200, 2),
  ('starters', 'Spring Rolls',      'spring-rolls',      'Crisp vegetable rolls, sweet chilli dip.',                  '🥟',  800, 3),
  ('mains',    'Nasi Lemak Ayam',   'nasi-lemak-ayam',   'Coconut rice, fried chicken, sambal, egg and anchovies.',   '🍛', 1500, 1),
  ('mains',    'Char Kuey Teow',    'char-kuey-teow',    'Wok-fried flat noodles with prawns and beansprouts.',       '🍜', 1400, 2),
  ('mains',    'Beef Rendang Rice', 'beef-rendang-rice', 'Slow-cooked dry beef curry with steamed rice.',             '🥘', 1800, 3),
  ('mains',    'Chicken Chop',      'chicken-chop',      'Grilled chicken thigh, black pepper sauce, fries.',         '🍗', 1900, 4),
  ('mains',    'Mee Goreng',        'mee-goreng',        'Spicy fried yellow noodles with tofu and egg.',             '🍝', 1300, 5),
  ('mains',    'Veggie Buddha Bowl','veggie-buddha-bowl','Brown rice, roast pumpkin, chickpeas, tahini.',             '🥗', 1600, 6),
  ('sides',    'Fries',             'fries',             'Skin-on, lightly salted.',                                  '🍟',  700, 1),
  ('sides',    'Garlic Bread',      'garlic-bread',      'Toasted with herb butter.',                                 '🥖',  600, 2),
  ('desserts', 'Cendol',            'cendol',            'Shaved ice, coconut milk and palm sugar.',                  '🍧',  700, 1),
  ('desserts', 'Chocolate Lava',    'chocolate-lava',    'Warm centre, vanilla ice cream.',                           '🍫', 1100, 2),
  ('drinks',   'Teh Tarik',         'teh-tarik',         'Pulled milk tea, hot or iced.',                             '🍵',  400, 1),
  ('drinks',   'Iced Lemon Tea',    'iced-lemon-tea',    'Freshly squeezed, not too sweet.',                          '🧋',  500, 2),
  ('drinks',   'Mineral Water',     'mineral-water',     'Chilled 500ml bottle.',                                     '💧',  200, 3)
) as v(category_slug, name, slug, description, emoji, price_cents, sort_order)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
