import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htzuvtsbgenbhqaoqqdt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0enV2dHNiZ2VuYmhxYW9xcWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjkxOTksImV4cCI6MjA5Mzk0NTE5OX0.qLJXf_r1_BMLudeiYSjdLTSM5RkxNwhp4QIswksIpBU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sql = `
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
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table clients enable row level security;
alter table briefing_snapshots enable row level security;
alter table client_meta enable row level security;

-- RLS Policies
create policy "public_read_write_clients" on clients
  for all using (true) with check (true);

create policy "public_read_write_snapshots" on briefing_snapshots
  for all using (true) with check (true);

create policy "public_read_write_meta" on client_meta
  for all using (true) with check (true);

-- Create indexes
create index if not exists idx_clients_client_id on clients(client_id);
create index if not exists idx_snapshots_client_id on briefing_snapshots(client_id);
create index if not exists idx_meta_client_id on client_meta(client_id);
`;

async function setupDatabase() {
  try {
    console.log('Creating tables...');

    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec', {
          query: statement.trim() + ';'
        });

        if (error) {
          console.error('Error executing statement:', statement.substring(0, 50), error);
        } else {
          console.log('✓', statement.substring(0, 50) + '...');
        }
      }
    }

    console.log('\n✅ Database setup complete!');
  } catch (err) {
    console.error('Setup failed:', err);
  }
}

setupDatabase();
