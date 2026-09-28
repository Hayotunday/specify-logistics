-- ============================================================
-- SPECIFY LOGISTICS — DATABASE SCHEMA
-- ============================================================
-- Run this in the Supabase SQL Editor to initialise (or reset)
-- the database from scratch.
-- ============================================================
-- ------------------------------------------------------------
-- SECTION 0: EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- SECTION 1: DROP EXISTING OBJECTS (reverse-dependency order)
-- ------------------------------------------------------------
-- Note: DROP TABLE ... CASCADE automatically removes all policies,
-- triggers, indexes, and rules on the table, so no need to drop
-- them separately. Tables are dropped children-first.
-- 1b. Tables (children before parents to satisfy FK constraints)
drop table if exists public.stock_entries cascade;

drop table if exists public.orders cascade;

drop table if exists public.products cascade;

drop table if exists public.merchants cascade;

drop table if exists public.merchant_access_keys cascade;

drop table if exists public.riders cascade;

drop table if exists public.landmarks cascade;

drop table if exists public.settings cascade;

drop table if exists public.customer_inquiries cascade;

drop table if exists public.users cascade;

-- 1c. Enum types (after tables that use them)
drop type if exists public.delivery_status;

drop type if exists public.inventory_status;

drop type if exists public.rider_type;

drop type if exists public.role;

-- ------------------------------------------------------------
-- SECTION 2: ENUM TYPES
-- ------------------------------------------------------------
create type public.delivery_status as enum(
  'delivered',
  'canceled',
  'returned',
  'pending',
  'shipped',
  'failed'
);

create type public.inventory_status as enum('packed', 'unpacked', 'out-of-stock');

create type public.rider_type as enum('in-house', 'external');

create type public.role as enum(
  'customer_service',
  'warehouse',
  'fom',
  'accounting',
  'admin'
);

-- ------------------------------------------------------------
-- SECTION 3: TABLE DEFINITIONS (parents before children)
-- ------------------------------------------------------------
-- 3a. Independent tables (no FK references to other app tables)
create table public.users (
  id uuid not null,
  email text,
  display_name text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_login timestamp with time zone,
  role public.role,
  is_deleted boolean
);

create table public.landmarks (
  id uuid not null,
  name text,
  price numeric(12, 2),
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

create table public.riders (
  id uuid not null,
  name text,
  phone text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  rider_type public.rider_type
);

create table public.settings (
  key text not null,
  value text,
  updated_at timestamp with time zone
);

create table public.customer_inquiries (
  id uuid not null,
  customer_name text,
  customer_email text,
  subject text,
  message text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- 3b. Tables that reference users
create table public.merchant_access_keys (
  id uuid not null,
  role text,
  access_key text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- 3c. Tables that reference users and merchant_access_keys
create table public.merchants (
  id uuid not null,
  name text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  approval_status text,
  submitted_by_role text,
  submitted_by uuid,
  admin_approved uuid,
  warehouse_approved uuid,
  customer_service_approved uuid
);

-- 3d. Tables that reference merchants and merchant_access_keys
create table public.products (
  id uuid not null,
  merchant_id uuid,
  name text,
  price numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  approval_status text,
  submitted_by_role text,
  submitted_by uuid,
  admin_approved uuid,
  warehouse_approved uuid,
  customer_service_approved uuid
);

-- 3e. Tables that reference users, merchants, riders, and landmarks
create table public.orders (
  id uuid not null,
  customer_name text,
  delivery_address text,
  phone_numbers jsonb,
  merchant uuid,
  cc_comment text,
  items jsonb,
  total_amount numeric(12, 2),
  wh_comment text,
  inventory_status public.inventory_status,
  fom_assigned uuid,
  fom_assigned_at timestamp with time zone,
  fom_comment text,
  rider_assigned_at timestamp with time zone,
  rider uuid,
  landmark uuid,
  payment_to_rider numeric(12, 2),
  payment_method text,
  payment_to_merchant numeric(12, 2),
  payment_confirmed boolean,
  bank text,
  extracted_by uuid,
  wh_delivery_status public.delivery_status,
  fom_delivery_status public.delivery_status,
  status public.role,
  payment_verified_at timestamp with time zone,
  quantity_delivered numeric,
  amount_paid numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  delivered_at timestamp with time zone,
  prints numeric
);

-- 3f. Tables that reference merchants, products, users, and merchant_access_keys
create table public.stock_entries (
  id uuid not null,
  merchant_id uuid,
  product_id uuid,
  quantity integer,
  notes text,
  status text,
  submitted_by uuid,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  submitted_by_role text,
  admin_approved uuid,
  warehouse_approved uuid,
  customer_service_approved uuid
);

-- ------------------------------------------------------------
-- SECTION 4: CONSTRAINTS (primary keys, unique, foreign keys)
-- ------------------------------------------------------------
-- 4a. Primary keys
alter table public.users
add constraint users_pkey primary key (id);

alter table public.landmarks
add constraint landmarks_pkey primary key (id);

alter table public.riders
add constraint riders_pkey primary key (id);

alter table public.settings
add constraint settings_pkey primary key (key);

alter table public.customer_inquiries
add constraint customer_inquiries_pkey primary key (id);

alter table public.merchant_access_keys
add constraint merchant_access_keys_pkey primary key (id);

alter table public.merchants
add constraint merchants_pkey primary key (id);

alter table public.products
add constraint products_pkey primary key (id);

alter table public.orders
add constraint orders_pkey primary key (id);

alter table public.stock_entries
add constraint stock_entries_pkey primary key (id);

-- 4b. Unique constraints
alter table public.users
add constraint users_email_key unique (email);

alter table public.landmarks
add constraint landmarks_name_key unique (name);

alter table public.riders
add constraint riders_name_key unique (name);

alter table public.merchants
add constraint merchants_name_key unique (name);

-- 4c. Foreign key constraints (children after parent PKs are established)
-- merchant_access_keys → users
alter table public.merchant_access_keys
add constraint merchant_access_keys_id_fkey foreign key (id) references public.users (id) on update cascade on delete cascade;

-- merchants → users
alter table public.merchants
add constraint merchants_submitted_by_fkey foreign key (submitted_by) references public.users (id);

-- merchants → merchant_access_keys
alter table public.merchants
add constraint merchants_admin_approved_fkey foreign key (admin_approved) references public.merchant_access_keys (id);

alter table public.merchants
add constraint merchants_warehouse_approved_fkey foreign key (warehouse_approved) references public.merchant_access_keys (id);

alter table public.merchants
add constraint merchants_customer_service_approved_fkey foreign key (customer_service_approved) references public.merchant_access_keys (id);

-- products → merchants
alter table public.products
add constraint products_merchant_id_fkey foreign key (merchant_id) references public.merchants (id) on delete cascade;

-- products → merchant_access_keys
alter table public.products
add constraint products_submitted_by_fkey foreign key (submitted_by) references public.merchant_access_keys (id);

alter table public.products
add constraint products_admin_approved_fkey foreign key (admin_approved) references public.merchant_access_keys (id);

alter table public.products
add constraint products_warehouse_approved_fkey foreign key (warehouse_approved) references public.merchant_access_keys (id);

alter table public.products
add constraint products_customer_service_approved_fkey foreign key (customer_service_approved) references public.merchant_access_keys (id);

-- orders → users
alter table public.orders
add constraint orders_extracted_by_fkey foreign key (extracted_by) references public.users (id) on delete set null;

alter table public.orders
add constraint orders_fom_assigned_fkey foreign key (fom_assigned) references public.users (id) on delete set null;

-- orders → merchants
alter table public.orders
add constraint orders_merchant_fkey foreign key (merchant) references public.merchants (id) on delete set null;

-- orders → riders
alter table public.orders
add constraint orders_rider_fkey foreign key (rider) references public.riders (id) on delete set null;

-- orders → landmarks
alter table public.orders
add constraint orders_landmark_fkey foreign key (landmark) references public.landmarks (id) on delete set null;

-- stock_entries → merchants
alter table public.stock_entries
add constraint stock_entries_merchant_id_fkey foreign key (merchant_id) references public.merchants (id) on delete cascade;

-- stock_entries → products
alter table public.stock_entries
add constraint stock_entries_product_id_fkey foreign key (product_id) references public.products (id) on delete cascade;

-- stock_entries → users
alter table public.stock_entries
add constraint stock_entries_submitted_by_fkey foreign key (submitted_by) references public.users (id) on delete set null;

alter table public.stock_entries
add constraint stock_entries_approved_by_fkey foreign key (approved_by) references public.users (id) on delete set null;

-- stock_entries → merchant_access_keys
alter table public.stock_entries
add constraint stock_entries_admin_approved_fkey foreign key (admin_approved) references public.merchant_access_keys (id);

alter table public.stock_entries
add constraint stock_entries_warehouse_approved_fkey foreign key (warehouse_approved) references public.merchant_access_keys (id);

alter table public.stock_entries
add constraint stock_entries_customer_service_approved_fkey foreign key (customer_service_approved) references public.merchant_access_keys (id);

-- ------------------------------------------------------------
-- SECTION 5: INDEXES
-- ------------------------------------------------------------
-- users
create unique index idx_users_pkey on public.users using btree (id);

create unique index idx_users_email_key on public.users using btree (email);

-- landmarks
create unique index idx_landmarks_pkey on public.landmarks using btree (id);

create unique index idx_landmarks_name_key on public.landmarks using btree (name);

-- riders
create unique index idx_riders_pkey on public.riders using btree (id);

create unique index idx_riders_name_key on public.riders using btree (name);

-- settings
create unique index idx_settings_pkey on public.settings using btree (key);

-- customer_inquiries
create unique index idx_customer_inquiries_pkey on public.customer_inquiries using btree (id);

-- merchant_access_keys
create unique index idx_merchant_access_keys_pkey on public.merchant_access_keys using btree (id);

-- merchants
create unique index idx_merchants_pkey on public.merchants using btree (id);

create unique index idx_merchants_name_key on public.merchants using btree (name);

-- products
create unique index idx_products_pkey on public.products using btree (id);

create index idx_products_merchant_id on public.products using btree (merchant_id);

-- orders
create unique index idx_orders_pkey on public.orders using btree (id);

-- stock_entries
create unique index idx_stock_entries_pkey on public.stock_entries using btree (id);

create index idx_stock_entries_merchant_id on public.stock_entries using btree (merchant_id);

create index idx_stock_entries_product_id on public.stock_entries using btree (product_id);

create index idx_stock_entries_status on public.stock_entries using btree (status);

-- ------------------------------------------------------------
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
-- Note: these permissive policies allow all operations and are
-- intended for development only. Tighten before production.
alter table public.users enable row level security;

alter table public.landmarks enable row level security;

alter table public.riders enable row level security;

alter table public.settings enable row level security;

alter table public.customer_inquiries enable row level security;

alter table public.merchant_access_keys enable row level security;

alter table public.merchants enable row level security;

alter table public.products enable row level security;

alter table public.orders enable row level security;

alter table public.stock_entries enable row level security;

create policy users_dev_allow_all on public.users as permissive for all to public using (true)
with
  check (true);

create policy landmarks_dev_allow_all on public.landmarks as permissive for all to public using (true)
with
  check (true);

create policy riders_dev_allow_all on public.riders as permissive for all to public using (true)
with
  check (true);

create policy settings_dev_allow_all on public.settings as permissive for all to public using (true)
with
  check (true);

create policy customer_inquiries_all on public.customer_inquiries as permissive for all to public using (true)
with
  check (true);

create policy merchant_access_keys_all on public.merchant_access_keys as permissive for all to public using (true)
with
  check (true);

create policy merchants_dev_allow_all on public.merchants as permissive for all to public using (true)
with
  check (true);

create policy products_all on public.products as permissive for all to public using (true)
with
  check (true);

create policy orders_dev_allow_all on public.orders as permissive for all to public using (true)
with
  check (true);

create policy stock_entries_all on public.stock_entries as permissive for all to public using (true)
with
  check (true);

-- ------------------------------------------------------------
-- SECTION 7: FUNCTIONS AND TRIGGERS
-- ------------------------------------------------------------
create or replace function public.set_updated_at () returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Attach triggers to tables
-- users
drop trigger if exists users_set_updated_at on public.users;

create trigger users_set_updated_at
before update on public.users for each row
execute procedure public.set_updated_at ();

-- orders
drop trigger if exists orders_set_updated_at on public.orders;

create trigger orders_set_updated_at
before update on public.orders for each row
execute procedure public.set_updated_at ();

-- merchants
drop trigger if exists merchants_set_updated_at on public.merchants;

create trigger merchants_set_updated_at
before update on public.merchants for each row
execute procedure public.set_updated_at ();

-- settings
drop trigger if exists settings_set_updated_at on public.settings;

create trigger settings_set_updated_at
before update on public.settings for each row
execute procedure public.set_updated_at ();

-- riders
drop trigger if exists riders_set_updated_at on public.riders;

create trigger riders_set_updated_at
before update on public.riders for each row
execute procedure public.set_updated_at ();

-- landmarks
drop trigger if exists landmarks_set_updated_at on public.landmarks;

create trigger landmarks_set_updated_at
before update on public.landmarks for each row
execute procedure public.set_updated_at ();

drop trigger if exists merchant_access_keys_set_updated_at on public.merchant_access_keys;

create trigger merchant_access_keys_set_updated_at
before update on public.merchant_access_keys for each row
execute procedure public.set_updated_at ();

drop trigger if exists products_set_updated_at on public.products;

create trigger products_set_updated_at
before update on public.products for each row
execute procedure public.set_updated_at ();

drop trigger if exists stock_entries_set_updated_at on public.stock_entries;

create trigger stock_entries_set_updated_at
before update on public.stock_entries for each row
execute procedure public.set_updated_at ();

-- get_global_stats function
drop function if exists get_global_stats (text);

create or replace function get_global_stats (fom_user_id uuid default null) returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_orders', count(o.id),
    'delivered_orders', count(o.id) filter (where o.fom_delivery_status = 'delivered' or o.inventory_status = 'delivered'),
    'failed_orders', count(o.id) filter (where o.fom_delivery_status in ('failed', 'canceled')),
    'total_revenue', coalesce(sum(o.amount_paid), 0),
    'total_owed', coalesce(sum(o.payment_to_merchant), 0),
    'total_fees', coalesce(sum(l.price), 0),
    'fom_assigned', count(o.id) filter (where o.status = 'fom' and (fom_user_id is null or o.fom_assigned = fom_user_id)),
    'fom_in_progress', count(o.id) filter (where o.status = 'fom' and (fom_user_id is null or o.fom_assigned = fom_user_id) and o.fom_delivery_status = 'pending'),
    'fom_ready', count(o.id) filter (where o.status = 'fom' and (fom_user_id is null or o.fom_assigned = fom_user_id) and o.fom_delivery_status = 'shipped'),
    'fom_completed_today', count(o.id) filter (where o.status = 'fom' and (fom_user_id is null or o.fom_assigned = fom_user_id) and o.fom_delivery_status = 'delivered' and date(o.updated_at) = current_date),
    'accounting_revenue', coalesce(sum(o.total_amount) filter (where o.payment_confirmed = true), 0),
    'accounting_pending', count(o.id) filter (where o.fom_delivery_status = 'delivered' and (o.payment_confirmed is null or o.payment_confirmed = false)),
    'accounting_confirmed', count(o.id) filter (where o.payment_confirmed = true)
  ) into result
  from orders o
  left join landmarks l on o.landmark = l.name;
  
  return result;
end;
$$ language plpgsql security definer;

----------------------------------------------------
----------------------------------------------------
----------------------------------------------------
insert into
  public.users (
    id,
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
  )
values
  (
    '35d2a581-2b8c-46c0-845a-35fe68f0379b',
    'admin@specify.com',
    'Admin User',
    'admin',
    true,
    now(),
    now()
  ),
  (
    'f33f8eea-e3a2-4be9-a3d2-babd3c51fa8a',
    'cs@specify.com',
    'Customer Service',
    'customer_service',
    true,
    now(),
    now()
  ),
  (
    'f68d78b5-44a9-4f6a-88ed-18ddaf580e00',
    'demo@specify.com',
    'Demo User',
    'customer_service',
    true,
    now(),
    now()
  ),
  (
    '7fe87941-e929-4011-804f-49bd9780b723',
    'warehouse@specify.com',
    'Warehouse User',
    'warehouse',
    true,
    now(),
    now()
  ),
  (
    '31941faa-0632-4f56-ab46-55cc3bec2f33',
    'accounting@specify.com',
    'Accounting User',
    'accounting',
    true,
    now(),
    now()
  ),
  (
    '8ea93c71-0287-4a49-a1ab-c31006e532f8',
    'fom1@specify.com',
    'FOM1 User',
    'fom',
    true,
    now(),
    now()
  ),
  (
    'bfdc9c38-590e-4db4-9c9a-0f67cfcaa9ad',
    'fom2@specify.com',
    'FOM2 User',
    'fom',
    true,
    now(),
    now()
  )
on conflict do nothing;
