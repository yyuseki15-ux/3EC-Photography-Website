create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  sport text not null,
  address text not null,
  event_date date not null,
  time_slot text not null,
  notes text,
  status text not null default 'new' check (status in ('new', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.bookings
add column if not exists status text not null default 'new';

update public.bookings
set status = 'new'
where status is null;

alter table public.bookings
drop constraint if exists bookings_status_check;

alter table public.bookings
add constraint bookings_status_check
check (status in ('new', 'confirmed', 'completed', 'cancelled'));

alter table public.bookings
add column if not exists address text;

update public.bookings
set address = 'Address not provided'
where address is null or btrim(address) = '';

alter table public.bookings
alter column address set not null;

alter table public.bookings
drop column if exists players;

alter table public.bookings
add column if not exists payment_status text;

alter table public.bookings
add column if not exists payment_amount_php integer;

update public.bookings
set payment_amount_php = 600
where payment_amount_php is null;

alter table public.bookings
alter column payment_amount_php set not null;

alter table public.bookings
drop constraint if exists bookings_payment_amount_php_check;

alter table public.bookings
add constraint bookings_payment_amount_php_check
check (payment_amount_php >= 600);

update public.bookings
set payment_status = 'paid'
where payment_status is null;

alter table public.bookings
alter column payment_status set not null;

alter table public.bookings
alter column payment_status set default 'awaiting_payment';

alter table public.bookings
drop constraint if exists bookings_payment_status_check;

alter table public.bookings
add constraint bookings_payment_status_check
check (payment_status in ('awaiting_payment', 'paid', 'cancelled', 'failed', 'expired'));

alter table public.bookings
add column if not exists paid_at timestamptz;

alter table public.bookings
add column if not exists proof_of_payment_path text;

alter table public.bookings
add column if not exists proof_uploaded_at timestamptz;

alter table public.bookings enable row level security;

revoke all on public.bookings from anon, authenticated;

create table if not exists public.unavailable_dates (
  id bigint generated always as identity primary key,
  blocked_date date not null,
  start_time text,
  end_time text,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.unavailable_dates
add column if not exists start_time text;

alter table public.unavailable_dates
add column if not exists end_time text;

alter table public.unavailable_dates
drop constraint if exists unavailable_dates_blocked_date_key;

alter table public.unavailable_dates enable row level security;

revoke all on public.unavailable_dates from anon, authenticated;
