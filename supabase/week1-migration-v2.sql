-- =====================================================================
-- NOMAAD — Week 1 Migration v2 (corrected against live DB state)
--
-- Reality check done against project xhrvynmxlyxyvjemabhy:
--   • clients (7 rows) is the canonical client table, not customers (0 rows)
--   • deliverables already exists with share_token + max_revisions — extend it
--   • ai_chat_sessions / ai_chat_messages already exist — we reuse
--   • projects currently status IN ('active','completed') — migrate
--
-- Idempotent: safe to re-run. Drop/recreate patterns where needed.
-- =====================================================================


-- ─── 1. CLIENTS: portal access fields ─────────────────────────────
alter table public.clients
  add column if not exists portal_user_id uuid references auth.users(id) on delete set null,
  add column if not exists portal_invited_at timestamptz,
  add column if not exists portal_accepted_at timestamptz,
  add column if not exists portal_enabled boolean default false,
  add column if not exists phone text,
  add column if not exists tags text[] default '{}',
  add column if not exists avatar_url text;

create index if not exists idx_clients_portal_user_id on public.clients(portal_user_id);


-- ─── 2. PROJECTS: creative stages + visibility + app-compatibility cols ─
-- App code references `name`, `description`, `due_date`, `color` — add them.
-- Keep existing `title` column; `name` will mirror it for code compat.
alter table public.projects
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists due_date timestamptz,
  add column if not exists color text default '#ccfd01',
  add column if not exists client_visible boolean default false,
  add column if not exists client_can_see_messages boolean default true,
  add column if not exists client_can_see_invoices boolean default true,
  add column if not exists updated_at timestamptz default now();

-- Backfill name from title for existing rows
update public.projects set name = title where name is null and title is not null;

-- Creative-work stages migration.
-- Drop any existing status check constraint.
do $$
declare c text;
begin
  for c in
    select constraint_name from information_schema.table_constraints
    where table_schema='public' and table_name='projects'
      and constraint_type='CHECK' and constraint_name like '%status%'
  loop
    execute format('alter table public.projects drop constraint if exists %I', c);
  end loop;
end $$;

-- Map existing status values → creative stages
update public.projects set status = case
  when status = 'active'    then 'production'
  when status = 'completed' then 'delivered'
  when status = 'planning'  then 'briefing'
  when status = 'review'    then 'review'
  when status = 'archived'  then 'delivered'
  else 'briefing'
end
where status in ('active','completed','planning','review','archived');

alter table public.projects
  add constraint projects_status_check
  check (status in ('briefing','production','review','delivered','invoiced'));

alter table public.projects alter column status set default 'briefing';


-- ─── 3. INVOICES: missing columns ──────────────────────────────────
alter table public.invoices
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists paid_at timestamptz,
  add column if not exists notes text,
  add column if not exists stripe_checkout_url text,
  add column if not exists number text,
  add column if not exists currency text default 'GBP',
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_invoices_project_id on public.invoices(project_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);


-- ─── 4. DELIVERABLES: extend for approval flow ────────────────────
-- Existing columns: id, user_id, project_id, client_id, title, description,
-- share_token, max_revisions, current_revision, status, created_at, updated_at
alter table public.deliverables
  add column if not exists file_url text,
  add column if not exists thumbnail_url text,
  add column if not exists approved_at timestamptz,
  add column if not exists sort_order integer default 0;

-- Expand status enum to include approval states (keep 'shared' for legacy)
do $$
declare c text;
begin
  for c in
    select constraint_name from information_schema.table_constraints
    where table_schema='public' and table_name='deliverables'
      and constraint_type='CHECK' and constraint_name like '%status%'
  loop
    execute format('alter table public.deliverables drop constraint if exists %I', c);
  end loop;
end $$;

alter table public.deliverables
  add constraint deliverables_status_check
  check (status in ('draft','pending','ready_for_review','shared','approved','changes_requested'));


-- ─── 5. TASKS: add tags + completed_at (if missing) ───────────────
alter table public.tasks
  add column if not exists tags text[] default '{}',
  add column if not exists completed_at timestamptz;


-- ─── 6. INTEGRATIONS: OAuth tokens ────────────────────────────────
create table if not exists public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null check (provider in ('gmail','google_calendar','stripe','vibe','whatsapp','twilio')),
  account_email text,
  access_token text,
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


-- ─── 7. GMAIL: threads + messages ─────────────────────────────────
create table if not exists public.gmail_threads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  gmail_thread_id text not null,
  subject text,
  snippet text,
  participants text[] default '{}',
  last_message_at timestamptz,
  is_unread boolean default false,
  is_starred boolean default false,
  client_id uuid references public.clients(id) on delete set null,
  labels text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, gmail_thread_id)
);

create index if not exists idx_gmail_threads_user_id on public.gmail_threads(user_id);
create index if not exists idx_gmail_threads_client_id on public.gmail_threads(client_id);
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
  is_sent boolean default false,
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


-- ─── 8. CLIENT-PORTAL RLS: read access chain via clients.portal_user_id ─

-- clients: portal user can see their own client row
drop policy if exists "client_can_view_own_client_record" on public.clients;
create policy "client_can_view_own_client_record"
  on public.clients for select
  using (portal_user_id = auth.uid());

-- projects: portal user can see shared projects
drop policy if exists "client_can_view_shared_projects" on public.projects;
create policy "client_can_view_shared_projects"
  on public.projects for select
  using (
    client_visible = true
    and client_id in (
      select id from public.clients where portal_user_id = auth.uid()
    )
  );

-- invoices: portal user can see their invoices
drop policy if exists "client_can_view_shared_invoices" on public.invoices;
create policy "client_can_view_shared_invoices"
  on public.invoices for select
  using (
    client_id in (
      select id from public.clients where portal_user_id = auth.uid()
    )
    and (
      project_id is null or project_id in (
        select id from public.projects
        where client_visible = true and client_can_see_invoices = true
      )
    )
  );

-- deliverables: portal user can view shared ones
drop policy if exists "client_can_view_shared_deliverables" on public.deliverables;
create policy "client_can_view_shared_deliverables"
  on public.deliverables for select
  using (
    project_id in (
      select p.id from public.projects p
      where p.client_visible = true
      and p.client_id in (
        select c.id from public.clients c where c.portal_user_id = auth.uid()
      )
    )
  );

-- deliverables: portal user can approve/request-changes
drop policy if exists "client_can_approve_deliverables" on public.deliverables;
create policy "client_can_approve_deliverables"
  on public.deliverables for update
  using (
    project_id in (
      select p.id from public.projects p
      where p.client_visible = true
      and p.client_id in (
        select c.id from public.clients c where c.portal_user_id = auth.uid()
      )
    )
  );

-- deliverable_comments: portal user can read + write on their shared deliverables
drop policy if exists "client_can_comment_on_shared_deliverables" on public.deliverable_comments;
create policy "client_can_comment_on_shared_deliverables"
  on public.deliverable_comments for all
  using (
    deliverable_id in (
      select d.id from public.deliverables d
      join public.projects p on p.id = d.project_id
      where p.client_visible = true
      and p.client_id in (
        select c.id from public.clients c where c.portal_user_id = auth.uid()
      )
    )
  );

-- profiles: portal user can view their creator's profile (branding)
drop policy if exists "client_can_view_creator_profile" on public.profiles;
create policy "client_can_view_creator_profile"
  on public.profiles for select
  using (
    id in (
      select user_id from public.clients where portal_user_id = auth.uid()
    )
  );


-- ─── 9. updated_at triggers for new tables ────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array[
    'integrations', 'gmail_threads', 'invoices', 'projects'
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


-- Done.
