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
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

revoke all on public.bookings from anon, authenticated;
