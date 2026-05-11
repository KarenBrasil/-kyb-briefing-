-- KyB Briefing Dashboard Schema
-- Run this SQL in Supabase's SQL Editor (Project Dashboard → SQL Editor)

-- Table: clients (draft current briefing for each client)
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  client_id text unique not null,
  client_name text not null,
  answers jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Table: briefing_snapshots (saved/finalized briefing versions)
create table if not exists briefing_snapshots (
  id uuid default gen_random_uuid() primary key,
  client_id text not null,
  client_name text not null,
  answers jsonb default '{}'::jsonb,
  saved_at timestamptz default now()
);

-- Table: client_meta (admin metadata: checklist, links, playlist per client)
create table if not exists client_meta (
  id uuid default gen_random_uuid() primary key,
  client_id text unique not null,
  checklist jsonb default '{}'::jsonb,
  links jsonb default '[]'::jsonb,
  playlist text default '',
  ideias jsonb default '[]'::jsonb,
  referencias jsonb default '[]'::jsonb,
  formatos jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table clients enable row level security;
alter table briefing_snapshots enable row level security;
alter table client_meta enable row level security;

-- RLS Policies: Allow all operations (auth is handled by the app with admin password)
create policy "public_read_write_clients" on clients
  for all using (true) with check (true);

create policy "public_read_write_snapshots" on briefing_snapshots
  for all using (true) with check (true);

create policy "public_read_write_meta" on client_meta
  for all using (true) with check (true);

-- Create indexes for better query performance
create index if not exists idx_clients_client_id on clients(client_id);
create index if not exists idx_snapshots_client_id on briefing_snapshots(client_id);
create index if not exists idx_meta_client_id on client_meta(client_id);
