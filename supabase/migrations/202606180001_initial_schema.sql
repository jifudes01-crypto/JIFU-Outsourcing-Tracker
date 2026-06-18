create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text default 'staff' check (role in ('super_admin','admin','manager','staff','viewer')),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null unique,
  contact_person text,
  phone text,
  email text,
  address text,
  note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  category_name text not null unique,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.outsource_orders (
  id uuid primary key default gen_random_uuid(),
  order_date date not null,
  vendor_id uuid references public.vendors(id),
  vendor_name text,
  requester text,
  creator_id uuid references public.profiles(id),
  creator_name text,
  item_name text not null,
  category text,
  quantity numeric default 1,
  unit_price numeric default 0,
  total_price numeric default 0,
  status text default '發包中' check (status in ('發包中','製作中','已完成','取消')),
  payment_status text default '未付款' check (payment_status in ('未付款','已付款','部分付款','不需付款')),
  payment_date date,
  payment_method text check (payment_method is null or payment_method in ('現金','匯款','支票','信用卡','其他')),
  payment_note text,
  invoice_file_url text,
  invoice_file_name text,
  remittance_file_url text,
  remittance_file_name text,
  note text,
  version integer default 1,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.outsource_orders(id) on delete cascade,
  action text not null,
  user_id uuid references public.profiles(id),
  user_name text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  file_name text,
  total_rows integer default 0,
  success_rows integer default 0,
  failed_rows integer default 0,
  imported_by uuid references public.profiles(id),
  imported_by_name text,
  created_at timestamp with time zone default now()
);

create table if not exists public.system_settings (
  id integer primary key default 1 check (id = 1),
  staff_can_import boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

insert into public.system_settings (id, staff_can_import)
values (1, true)
on conflict (id) do nothing;

insert into public.categories (category_name, sort_order)
values
  ('印刷', 1),
  ('輸出', 2),
  ('設計', 3),
  ('攝影', 4),
  ('廣告', 5),
  ('耗材', 6),
  ('其他', 7)
on conflict (category_name) do nothing;

create index if not exists outsource_orders_order_date_idx on public.outsource_orders(order_date);
create index if not exists outsource_orders_vendor_idx on public.outsource_orders(vendor_name);
create index if not exists outsource_orders_creator_idx on public.outsource_orders(created_by);
create index if not exists outsource_orders_payment_idx on public.outsource_orders(payment_status);
create index if not exists audit_logs_order_idx on public.audit_logs(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

drop trigger if exists outsource_orders_set_updated_at on public.outsource_orders;
create trigger outsource_orders_set_updated_at
before update on public.outsource_orders
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid() and is_active = true), 'viewer')
$$;

create or replace function public.is_admin_like()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('super_admin','admin','manager')
$$;

create or replace function public.can_staff_import()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select staff_can_import from public.system_settings where id = 1), true)
$$;

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.categories enable row level security;
alter table public.outsource_orders enable row level security;
alter table public.audit_logs enable row level security;
alter table public.import_logs enable row level security;
alter table public.system_settings enable row level security;

drop policy if exists "profiles read authenticated" on public.profiles;
create policy "profiles read authenticated"
on public.profiles for select
to authenticated using (true);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self"
on public.profiles for insert
to authenticated with check (id = auth.uid());

drop policy if exists "profiles update self or admin" on public.profiles;
create policy "profiles update self or admin"
on public.profiles for update
to authenticated using (id = auth.uid() or public.current_user_role() in ('super_admin','admin'))
with check (id = auth.uid() or public.current_user_role() in ('super_admin','admin'));

drop policy if exists "vendors read authenticated" on public.vendors;
create policy "vendors read authenticated"
on public.vendors for select
to authenticated using (true);

drop policy if exists "vendors manage writable roles" on public.vendors;
create policy "vendors manage writable roles"
on public.vendors for all
to authenticated using (public.current_user_role() in ('super_admin','admin','manager','staff'))
with check (public.current_user_role() in ('super_admin','admin','manager','staff'));

drop policy if exists "categories read authenticated" on public.categories;
create policy "categories read authenticated"
on public.categories for select
to authenticated using (true);

drop policy if exists "categories manage writable roles" on public.categories;
create policy "categories manage writable roles"
on public.categories for all
to authenticated using (public.current_user_role() in ('super_admin','admin','manager','staff'))
with check (public.current_user_role() in ('super_admin','admin','manager','staff'));

drop policy if exists "orders read authenticated" on public.outsource_orders;
create policy "orders read authenticated"
on public.outsource_orders for select
to authenticated using (true);

drop policy if exists "orders insert non viewer" on public.outsource_orders;
create policy "orders insert non viewer"
on public.outsource_orders for insert
to authenticated with check (
  public.current_user_role() in ('super_admin','admin','manager','staff')
  and created_by = auth.uid()
);

drop policy if exists "orders update owner or admin" on public.outsource_orders;
create policy "orders update owner or admin"
on public.outsource_orders for update
to authenticated using (
  public.current_user_role() in ('super_admin','admin','manager')
  or created_by = auth.uid()
)
with check (
  public.current_user_role() in ('super_admin','admin','manager')
  or created_by = auth.uid()
);

drop policy if exists "orders delete admin only" on public.outsource_orders;
create policy "orders delete admin only"
on public.outsource_orders for delete
to authenticated using (public.current_user_role() in ('super_admin','admin'));

drop policy if exists "audit read admin" on public.audit_logs;
create policy "audit read admin"
on public.audit_logs for select
to authenticated using (public.current_user_role() in ('super_admin','admin','manager'));

drop policy if exists "audit insert authenticated" on public.audit_logs;
create policy "audit insert authenticated"
on public.audit_logs for insert
to authenticated with check (auth.uid() = user_id);

drop policy if exists "import logs read manager" on public.import_logs;
create policy "import logs read manager"
on public.import_logs for select
to authenticated using (public.current_user_role() in ('super_admin','admin','manager'));

drop policy if exists "import logs insert importers" on public.import_logs;
create policy "import logs insert importers"
on public.import_logs for insert
to authenticated with check (
  public.current_user_role() in ('super_admin','admin','manager')
  or (public.current_user_role() = 'staff' and public.can_staff_import())
);

drop policy if exists "settings read authenticated" on public.system_settings;
create policy "settings read authenticated"
on public.system_settings for select
to authenticated using (true);

drop policy if exists "settings update admin" on public.system_settings;
create policy "settings update admin"
on public.system_settings for update
to authenticated using (public.current_user_role() in ('super_admin','admin'))
with check (public.current_user_role() in ('super_admin','admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('invoices', 'invoices', true, 10485760, array['image/jpeg','image/png','application/pdf']),
  ('remittances', 'remittances', true, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "attachments read authenticated" on storage.objects;
drop policy if exists "attachments insert non viewer" on storage.objects;
drop policy if exists "attachments update owner or admin" on storage.objects;
drop policy if exists "attachments delete owner or admin" on storage.objects;
drop policy if exists "jifu files read authenticated" on storage.objects;
create policy "jifu files read authenticated"
on storage.objects for select
to authenticated using (bucket_id in ('invoices','remittances'));

drop policy if exists "jifu files insert non viewer" on storage.objects;
create policy "jifu files insert non viewer"
on storage.objects for insert
to authenticated with check (
  bucket_id in ('invoices','remittances')
  and public.current_user_role() in ('super_admin','admin','manager','staff')
);

drop policy if exists "jifu files update owner or admin" on storage.objects;
create policy "jifu files update owner or admin"
on storage.objects for update
to authenticated using (
  bucket_id in ('invoices','remittances')
  and public.current_user_role() in ('super_admin','admin','manager','staff')
);

drop policy if exists "jifu files delete owner or admin" on storage.objects;
create policy "jifu files delete owner or admin"
on storage.objects for delete
to authenticated using (
  bucket_id in ('invoices','remittances')
  and public.current_user_role() in ('super_admin','admin','manager','staff')
);
