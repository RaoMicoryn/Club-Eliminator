-- Skema database Seleksi Klub (Neon Postgres)

create table if not exists clubs (
  id serial primary key,
  name text unique not null,
  capacity integer not null default 28,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id serial primary key,
  timestamp_raw text not null default '',
  timestamp_ms bigint,
  nama text not null,
  kelas text not null default '',
  pilihan1 text not null,
  pilihan2 text not null default '',
  pilihan3 text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_students_timestamp on students (timestamp_ms);

create table if not exists app_settings (
  key text primary key,
  value text not null
);

insert into app_settings (key, value) values ('default_capacity', '28')
  on conflict (key) do nothing;

insert into clubs (name, capacity, sort_order) values
  ('ACCOUNTING', 28, 1),
  ('BROADCAST', 28, 2),
  ('ENGLISH CLUB', 28, 3),
  ('FOTOGRAFI', 28, 4),
  ('PERFORMING ARTS (TEATER DAN DANCE)', 28, 5),
  ('SKETSA DAN ILUSTRASI', 28, 6)
on conflict (name) do nothing;
