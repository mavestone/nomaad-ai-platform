-- ============================================
-- NOMAAD AI PLATFORM — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- ─── 1. PROFILES ────────────────────────────
-- Auto-created when a user signs up via trigger
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  location text,
  availability text default 'away',
  social_links jsonb default '{}',
  portfolio_projects jsonb default '[]',
  company text,
  business_name text,
  role text default 'owner',
  business_type text,
  onboarding_complete boolean default false,
  use_cases text[] default '{}',
  skills text[] default '{}',
  username_changed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── 2. CUSTOMERS (CRM) ────────────────────
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  company text,
  status text default 'lead' check (status in ('lead', 'prospect', 'active', 'inactive', 'churned')),
  value numeric(12,2) default 0,
  notes text,
  tags text[] default '{}',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.customers enable row level security;

create policy "Users can manage own customers"
  on public.customers for all using (auth.uid() = user_id);


-- ─── 3. PROSPECTS (Prospecting Pipeline) ───
create table if not exists public.prospects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text,
  company text,
  source text,
  stage text default 'new' check (stage in ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  value numeric(12,2) default 0,
  notes text,
  next_follow_up timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prospects enable row level security;

create policy "Users can manage own prospects"
  on public.prospects for all using (auth.uid() = user_id);


-- ─── 4. PROJECTS ────────────────────────────
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  status text default 'active' check (status in ('planning', 'active', 'review', 'completed', 'archived')),
  client_name text,
  color text default '#ccfd01',
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Users can manage own projects"
  on public.projects for all using (auth.uid() = user_id);


-- ─── 5. TASKS (Project tasks / Kanban) ──────
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee text,
  due_date timestamptz,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users can manage own tasks"
  on public.tasks for all using (auth.uid() = user_id);


-- ─── 6. CALENDAR EVENTS ────────────────────
create table if not exists public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean default false,
  color text default '#ccfd01',
  location text,
  attendees text[] default '{}',
  is_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.calendar_events enable row level security;

create policy "Users can manage own events"
  on public.calendar_events for all using (auth.uid() = user_id);


-- ─── 7. DOCUMENTS ───────────────────────────
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text default '',
  folder text default 'General',
  is_pinned boolean default false,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can manage own documents"
  on public.documents for all using (auth.uid() = user_id);


-- ─── 8. MESSAGES / CHANNELS ────────────────
create table if not exists public.channels (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_direct boolean default false,
  members text[] default '{}',
  created_at timestamptz default now()
);

alter table public.channels enable row level security;

create policy "Users can manage own channels"
  on public.channels for all using (auth.uid() = user_id);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  sender_name text,
  attachments text[] default '{}',
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can manage own messages"
  on public.messages for all using (auth.uid() = user_id);


-- ─── 9. AUTOMATIONS ────────────────────────
create table if not exists public.automations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_active boolean default false,
  trigger_type text,
  nodes jsonb default '[]',
  edges jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.automations enable row level security;

create policy "Users can manage own automations"
  on public.automations for all using (auth.uid() = user_id);


-- ─── 10. FINANCIALS ──────────────────────────
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  description text not null,
  amount numeric(12,2) not null,
  type text check (type in ('income', 'expense')),
  status text default 'completed' check (status in ('pending', 'processing', 'completed', 'failed')),
  account text,
  transaction_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.transactions enable row level security;
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);

create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_name text not null,
  amount numeric(12,2) not null,
  status text default 'pending' check (status in ('draft', 'pending', 'paid', 'overdue')),
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.invoices enable row level security;
create policy "Users can manage own invoices" on public.invoices for all using (auth.uid() = user_id);

-- ─── 11. UPDATED_AT TRIGGER ────────────────
-- Automatically update the updated_at column
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles', 'customers', 'prospects', 'projects',
    'tasks', 'calendar_events', 'documents', 'automations',
    'transactions', 'invoices'
  ])
  loop
    execute format(
      'create or replace trigger update_%s_updated_at
       before update on public.%s
       for each row execute procedure public.update_updated_at()',
      t, t
    );
  end loop;
end $$;


-- ─── Done! ──────────────────────────────────
-- Your database is ready. Tables created:
--   profiles, customers, prospects, projects, tasks,
--   calendar_events, documents, channels, messages, automations,
--   transactions, invoices

-- ─── 12. WAITLIST ───────────────────────────
create table if not exists public.waitlist_signups (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  source text,
  created_at timestamptz default now()
);

alter table public.waitlist_signups enable row level security;

create policy "Allow public inserts to waitlist"
  on public.waitlist_signups for insert with check (true);

create policy "Allow public view for total count"
  on public.waitlist_signups for select using (true);
