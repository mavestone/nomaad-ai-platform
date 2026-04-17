-- =====================================================================
-- NOMAAD — Week 1 Migration
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotent: safe to re-run. Every change is guarded.
--
-- Covers:
--   1. Client FKs on projects/invoices/tasks (no more free-text client_name)
--   2. Creative-work project stages (briefing → production → review → delivered → invoiced)
--   3. Portal fields on customers (invite clients to their own view)
--   4. Deliverables + comments (approvals + revision rounds)
--   5. Gmail integration tables
--   6. Generic integrations table (tokens for Gmail, Google Cal, Stripe, Vibe, etc.)
--   7. AI conversations + messages (AI floater history)
--   8. Per-project client-visibility toggles
--   9. RLS policies for client-portal users (new auth role)
-- =====================================================================


-- ─── 1. CUSTOMERS: portal access fields ────────────────────────────────
alter table public.customers
  add column if not exists portal_user_id uuid references auth.users(id) on delete set null,
  add column if not exists portal_invited_at timestamptz,
  add column if not exists portal_accepted_at timestamptz,
  add column if not exists portal_enabled boolean default false;

create index if not exists idx_customers_portal_user_id on public.customers(portal_user_id);


-- ─── 2. PROJECTS: client FK, creative stages, visibility toggles ──────
alter table public.projects
  add column if not exists client_id uuid references public.customers(id) on delete set null,
  add column if not exists client_visible boolean default false,
  add column if not exists client_can_see_messages boolean default true,
  add column if not exists client_can_see_invoices boolean default true;

create index if not exists idx_projects_client_id on public.projects(client_id);

-- Migrate project status → creative stages.
-- Drop old check constraint, map values, add new one.
alter table public.projects drop constraint if exists projects_status_check;

update public.projects set status = case
  when status = 'planning'  then 'briefing'
  when status = 'active'    then 'production'
  when status = 'review'    then 'review'
  when status = 'completed' then 'delivered'
  when status = 'archived'  then 'delivered'
  else 'briefing'
end
where status in ('planning','active','review','completed','archived');

alter table public.projects
  add constraint projects_status_check
  check (status in ('briefing','production','review','delivered','invoiced'));

alter table public.projects alter column status set default 'briefing';


-- ─── 3. INVOICES: link to client + project, paid tracking, Stripe ─────
alter table public.invoices
  add column if not exists client_id uuid references public.customers(id) on delete set null,
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists paid_at timestamptz,
  add column if not exists line_items jsonb default '[]',
  add column if not exists notes text,
  add column if not exists stripe_checkout_url text,
  add column if not exists number text,
  add column if not exists currency text default 'GBP';

create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_project_id on public.invoices(project_id);


-- ─── 4. TASKS: link to client (via project already), add tags ─────────
alter table public.tasks
  add column if not exists tags text[] default '{}',
  add column if not exists completed_at timestamptz;


-- ─── 5. DELIVERABLES + COMMENTS ───────────────────────────────────────
create table if not exists public.deliverables (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  file_url text,
  thumbnail_url text,
  status text default 'pending' check (status in ('pending','ready_for_review','approved','changes_requested')),
  revision_round integer default 1,
  revision_limit integer default 3,
  sort_order integer default 0,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_deliverables_project_id on public.deliverables(project_id);

alter table public.deliverables enable row level security;

drop policy if exists "creator_manage_own_deliverables" on public.deliverables;
create policy "creator_manage_own_deliverables"
  on public.deliverables for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Client (portal user) can READ deliverables if their customer record owns the parent project
drop policy if exists "client_can_view_shared_deliverables" on public.deliverables;
create policy "client_can_view_shared_deliverables"
  on public.deliverables for select
  using (
    project_id in (
      select p.id from public.projects p
      where p.client_visible = true
      and p.client_id in (
        select c.id from public.customers c where c.portal_user_id = auth.uid()
      )
    )
  );

-- Client can UPDATE status (approve / request changes) on their own deliverables
drop policy if exists "client_can_approve_deliverables" on public.deliverables;
create policy "client_can_approve_deliverables"
  on public.deliverables for update
  using (
    project_id in (
      select p.id from public.projects p
      where p.client_visible = true
      and p.client_id in (
        select c.id from public.customers c where c.portal_user_id = auth.uid()
      )
    )
  );

create table if not exists public.deliverable_comments (
  id uuid default gen_random_uuid() primary key,
  deliverable_id uuid references public.deliverables(id) on delete cascade not null,
  author_user_id uuid references auth.users(id) on delete set null,
  author_type text not null check (author_type in ('creator','client')),
  body text not null,
  created_at timestamptz default now()
);

create index if not exists idx_deliverable_comments_deliverable_id
  on public.deliverable_comments(deliverable_id);

alter table public.deliverable_comments enable row level security;

drop policy if exists "creator_manage_own_deliverable_comments" on public.deliverable_comments;
create policy "creator_manage_own_deliverable_comments"
  on public.deliverable_comments for all
  using (
    deliverable_id in (
      select id from public.deliverables where user_id = auth.uid()
    )
  );

drop policy if exists "client_can_comment_on_shared_deliverables" on public.deliverable_comments;
create policy "client_can_comment_on_shared_deliverables"
  on public.deliverable_comments for all
  using (
    deliverable_id in (
      select d.id from public.deliverables d
      join public.projects p on p.id = d.project_id
      where p.client_visible = true
      and p.client_id in (
        select c.id from public.customers c where c.portal_user_id = auth.uid()
      )
    )
  );


-- ─── 6. INTEGRATIONS: OAuth tokens for Gmail, Google Cal, Stripe, etc. ─
create table if not exists public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null check (provider in ('gmail','google_calendar','stripe','vibe','whatsapp','twilio')),
  account_email text,
  access_token text,          -- consider column-level encryption via pgcrypto later
  refresh_token text,
  expires_at timestamptz,
  scopes text[] default '{}',
  metadata jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider, account_email)
);

alter table public.integrations enable row level security;

drop policy if exists "users_manage_own_integrations" on public.integrations;
create policy "users_manage_own_integrations"
  on public.integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── 7. GMAIL: threads + messages ─────────────────────────────────────
create table if not exists public.gmail_threads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  gmail_thread_id text not null,        -- Google's thread id
  subject text,
  snippet text,
  participants text[] default '{}',
  last_message_at timestamptz,
  is_unread boolean default false,
  is_starred boolean default false,
  customer_id uuid references public.customers(id) on delete set null,
  labels text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, gmail_thread_id)
);

create index if not exists idx_gmail_threads_user_id on public.gmail_threads(user_id);
create index if not exists idx_gmail_threads_customer_id on public.gmail_threads(customer_id);
create index if not exists idx_gmail_threads_last_message_at on public.gmail_threads(last_message_at desc);

alter table public.gmail_threads enable row level security;

drop policy if exists "users_manage_own_gmail_threads" on public.gmail_threads;
create policy "users_manage_own_gmail_threads"
  on public.gmail_threads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.gmail_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  thread_id uuid references public.gmail_threads(id) on delete cascade not null,
  gmail_message_id text not null,
  from_address text,
  to_addresses text[] default '{}',
  cc_addresses text[] default '{}',
  subject text,
  snippet text,
  body_text text,
  body_html text,
  received_at timestamptz,
  is_sent boolean default false,        -- true = we sent it, false = incoming
  attachments jsonb default '[]',
  created_at timestamptz default now(),
  unique(user_id, gmail_message_id)
);

create index if not exists idx_gmail_messages_thread_id on public.gmail_messages(thread_id);
create index if not exists idx_gmail_messages_received_at on public.gmail_messages(received_at desc);

alter table public.gmail_messages enable row level security;

drop policy if exists "users_manage_own_gmail_messages" on public.gmail_messages;
create policy "users_manage_own_gmail_messages"
  on public.gmail_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── 8. AI: conversations + messages (floater history) ────────────────
create table if not exists public.ai_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'New conversation',
  context jsonb default '{}',            -- { view: 'projects', selected_id: '...' }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ai_conversations_user_id on public.ai_conversations(user_id);

alter table public.ai_conversations enable row level security;

drop policy if exists "users_manage_own_ai_conversations" on public.ai_conversations;
create policy "users_manage_own_ai_conversations"
  on public.ai_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.ai_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.ai_conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user','assistant','tool')),
  content text not null,
  tool_calls jsonb,
  tool_results jsonb,
  model text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz default now()
);

create index if not exists idx_ai_messages_conversation_id on public.ai_messages(conversation_id);

alter table public.ai_messages enable row level security;

drop policy if exists "users_manage_own_ai_messages" on public.ai_messages;
create policy "users_manage_own_ai_messages"
  on public.ai_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── 9. CLIENT-PORTAL RLS: read access to parent tables ───────────────
-- Client-portal users must be able to read the projects/invoices/customers/
-- messages that belong to them (via customers.portal_user_id chain).

-- customers: client can see their own customer row
drop policy if exists "client_can_view_own_customer_record" on public.customers;
create policy "client_can_view_own_customer_record"
  on public.customers for select
  using (portal_user_id = auth.uid());

-- projects: client can see projects where they're the client AND client_visible = true
drop policy if exists "client_can_view_shared_projects" on public.projects;
create policy "client_can_view_shared_projects"
  on public.projects for select
  using (
    client_visible = true
    and client_id in (
      select id from public.customers where portal_user_id = auth.uid()
    )
  );

-- invoices: client can see invoices linked to their customer record, if project allows
drop policy if exists "client_can_view_shared_invoices" on public.invoices;
create policy "client_can_view_shared_invoices"
  on public.invoices for select
  using (
    client_id in (
      select id from public.customers where portal_user_id = auth.uid()
    )
    and (
      project_id is null or project_id in (
        select id from public.projects
        where client_visible = true and client_can_see_invoices = true
      )
    )
  );

-- profiles: client can view the creator's profile (for portal branding)
drop policy if exists "client_can_view_creator_profile" on public.profiles;
create policy "client_can_view_creator_profile"
  on public.profiles for select
  using (
    id in (
      select user_id from public.customers where portal_user_id = auth.uid()
    )
  );


-- ─── 10. updated_at triggers for new tables ───────────────────────────
do $$
declare t text;
begin
  for t in select unnest(array[
    'deliverables', 'integrations', 'gmail_threads', 'ai_conversations'
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


-- ─── Done ─────────────────────────────────────────────────────────────
-- Verify by running:
--   select count(*) from public.deliverables;
--   select count(*) from public.integrations;
--   select count(*) from public.gmail_threads;
--   select count(*) from public.ai_conversations;
--   \d public.projects   -- should show client_id, client_visible, etc.
