create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  sport text not null,
  event_date date not null,
  time_slot text not null,
  players integer not null check (players >= 1),
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

alter table public.bookings enable row level security;

revoke all on public.bookings from anon, authenticated;

create table if not exists public.unavailable_dates (
  id bigint generated always as identity primary key,
  blocked_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.unavailable_dates enable row level security;

revoke all on public.unavailable_dates from anon, authenticated;
