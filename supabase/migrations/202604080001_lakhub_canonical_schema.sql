create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'platform_role') then
    create type public.platform_role as enum ('user', 'admin', 'superadmin');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_role') then
    create type public.project_role as enum ('owner', 'admin', 'collaborator', 'reviewer', 'reader');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('planning', 'active', 'review', 'completed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'deliverable_status') then
    create type public.deliverable_status as enum ('planned', 'in_progress', 'done', 'blocked');
  end if;
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
  end if;
  if not exists (select 1 from pg_type where typname = 'document_kind') then
    create type public.document_kind as enum ('note', 'article', 'chapter', 'thesis', 'report');
  end if;
  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type public.document_status as enum ('draft', 'in_review', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum ('submitted', 'changes_requested', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'comment_status') then
    create type public.comment_status as enum ('open', 'resolved');
  end if;
  if not exists (select 1 from pg_type where typname = 'suggestion_status') then
    create type public.suggestion_status as enum ('open', 'accepted', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'library_item_type') then
    create type public.library_item_type as enum ('pdf', 'docx', 'note', 'web', 'book', 'article');
  end if;
  if not exists (select 1 from pg_type where typname = 'theme_mode') then
    create type public.theme_mode as enum ('light', 'dark', 'system');
  end if;
  if not exists (select 1 from pg_type where typname = 'ai_provider') then
    create type public.ai_provider as enum ('claude', 'perplexity');
  end if;
  if not exists (select 1 from pg_type where typname = 'ai_mode') then
    create type public.ai_mode as enum ('auto', 'writing', 'research', 'critique', 'compare');
  end if;
  if not exists (select 1 from pg_type where typname = 'ai_message_role') then
    create type public.ai_message_role as enum ('user', 'assistant', 'system');
  end if;
  if not exists (select 1 from pg_type where typname = 'ai_run_status') then
    create type public.ai_run_status as enum ('pending', 'completed', 'failed');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text,
  institution text,
  bio text,
  avatar_path text,
  role public.platform_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  theme public.theme_mode not null default 'system',
  email_notifications boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  problem_statement text,
  objectives text,
  status public.project_status not null default 'planning',
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.project_role not null default 'reader',
  invited_by uuid references public.users(id) on delete set null,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status public.deliverable_status not null default 'planned',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email citext not null,
  role public.project_role not null,
  token uuid not null unique,
  invited_by uuid not null references public.users(id) on delete cascade,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  kind public.document_kind not null,
  status public.document_status not null default 'draft',
  content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  plain_text text not null default '',
  last_edited_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  title text not null,
  summary text,
  content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (document_id, version_number)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_id uuid not null references public.document_versions(id) on delete cascade,
  submitted_by uuid not null references public.users(id) on delete cascade,
  reviewer_user_id uuid references public.users(id) on delete set null,
  status public.submission_status not null default 'submitted',
  note text,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.citations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  library_item_id uuid,
  citation_key text not null,
  locator text,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_id uuid references public.document_versions(id) on delete set null,
  author_user_id uuid not null references public.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  anchor_id text not null,
  body text not null,
  status public.comment_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_id uuid references public.document_versions(id) on delete set null,
  author_user_id uuid not null references public.users(id) on delete cascade,
  anchor_id text not null,
  original_text text not null,
  proposed_text text not null,
  status public.suggestion_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  authors text[] not null default '{}',
  publication_year integer check (publication_year between 1900 and 2100),
  doi citext,
  summary text,
  abstract text,
  item_type public.library_item_type not null default 'article',
  url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id, name)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id, name)
);

create table if not exists public.item_collections (
  item_id uuid not null references public.library_items(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  primary key (item_id, collection_id)
);

create table if not exists public.item_tags (
  item_id uuid not null references public.library_items(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  provider public.ai_provider not null,
  mode public.ai_mode not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role public.ai_message_role not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  provider public.ai_provider not null,
  mode public.ai_mode not null,
  prompt text not null,
  output text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  status public.ai_run_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_sources (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_runs(id) on delete cascade,
  title text not null,
  url text not null,
  snippet text,
  source_rank integer not null default 1 check (source_rank > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider public.ai_provider not null,
  usage_date date not null default current_date,
  request_count integer not null default 1 check (request_count >= 0),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, provider, usage_date)
);

create table if not exists public.ai_saved_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  run_id uuid references public.ai_runs(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  kind text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete cascade,
  title text not null,
  kind text not null,
  prompt_template text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  library_item_id uuid references public.library_items(id) on delete set null,
  bucket text not null,
  path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.citations
  drop constraint if exists citations_library_item_id_fkey;

alter table public.citations
  add constraint citations_library_item_id_fkey
  foreign key (library_item_id) references public.library_items(id) on delete set null;

create unique index if not exists invitations_unique_pending_email_per_project
  on public.invitations(project_id, email)
  where status = 'pending';

create unique index if not exists citations_unique_key_per_document
  on public.citations(document_id, citation_key);

create index if not exists projects_owner_idx on public.projects(owner_user_id);
create index if not exists projects_due_date_idx on public.projects(due_date);
create index if not exists project_members_user_idx on public.project_members(user_id);
create index if not exists deliverables_project_due_idx on public.deliverables(project_id, due_date);
create index if not exists invitations_project_idx on public.invitations(project_id);
create index if not exists documents_project_idx on public.documents(project_id);
create index if not exists documents_owner_idx on public.documents(owner_user_id);
create index if not exists document_versions_document_idx on public.document_versions(document_id);
create index if not exists submissions_document_idx on public.submissions(document_id);
create index if not exists comments_document_idx on public.comments(document_id);
create index if not exists suggestions_document_idx on public.suggestions(document_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists library_items_owner_idx on public.library_items(owner_user_id);
create index if not exists library_items_project_idx on public.library_items(project_id);
create index if not exists ai_conversations_user_idx on public.ai_conversations(user_id, updated_at desc);
create index if not exists ai_runs_user_idx on public.ai_runs(user_id, created_at desc);
create index if not exists ai_sources_run_idx on public.ai_sources(run_id);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id, created_at desc);
create index if not exists assets_owner_idx on public.assets(owner_user_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name);

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.handle_new_project_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role, invited_by)
  values (new.id, new.owner_user_id, 'owner', new.owner_user_id)
  on conflict (project_id, user_id) do update
    set role = 'owner';

  return new;
end;
$$;

create or replace function public.current_platform_role()
returns public.platform_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role from public.users u where u.id = auth.uid()
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_platform_role() in ('admin', 'superadmin'), false)
$$;

create or replace function public.project_role_for_user(target_project uuid, target_user uuid default auth.uid())
returns public.project_role
language sql
stable
security definer
set search_path = public
as $$
  select pm.role
  from public.project_members pm
  where pm.project_id = target_project and pm.user_id = target_user
  limit 1
$$;

create or replace function public.has_project_role(target_project uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.project_role_for_user(target_project) = any(allowed_roles::public.project_role[]), false)
$$;

create or replace function public.shares_project_with_user(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members mine
    join public.project_members theirs on theirs.project_id = mine.project_id
    where mine.user_id = auth.uid() and theirs.user_id = target_user
  )
$$;

create or replace function public.can_read_project(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = target_project and p.owner_user_id = auth.uid()
    )
    or public.has_project_role(target_project, array['owner', 'admin', 'collaborator', 'reviewer', 'reader'])
$$;

create or replace function public.can_manage_project(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = target_project and p.owner_user_id = auth.uid()
    )
    or public.has_project_role(target_project, array['owner', 'admin'])
$$;

create or replace function public.can_manage_deliverables(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = target_project and p.owner_user_id = auth.uid()
    )
    or public.has_project_role(target_project, array['owner', 'admin', 'collaborator'])
$$;

create or replace function public.document_project_id(target_document uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.project_id from public.documents d where d.id = target_document
$$;

create or replace function public.document_owner_id(target_document uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.owner_user_id from public.documents d where d.id = target_document
$$;

create or replace function public.can_read_document(target_document uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or public.document_owner_id(target_document) = auth.uid()
    or (
      public.document_project_id(target_document) is not null
      and public.can_read_project(public.document_project_id(target_document))
    )
$$;

create or replace function public.can_edit_document(target_document uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or public.document_owner_id(target_document) = auth.uid()
    or (
      public.document_project_id(target_document) is not null
      and public.has_project_role(public.document_project_id(target_document), array['owner', 'admin', 'collaborator'])
    )
$$;

create or replace function public.can_review_document(target_document uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or public.document_owner_id(target_document) = auth.uid()
    or (
      public.document_project_id(target_document) is not null
      and public.has_project_role(public.document_project_id(target_document), array['owner', 'admin', 'collaborator', 'reviewer'])
    )
$$;

create or replace function public.can_view_library_item(target_item uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.library_items li
      where li.id = target_item
        and (
          li.owner_user_id = auth.uid()
          or (li.project_id is not null and public.can_read_project(li.project_id))
        )
    )
$$;

create or replace function public.can_edit_library_item(target_item uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.library_items li
      where li.id = target_item and li.owner_user_id = auth.uid()
    )
$$;

create or replace function public.has_pending_invitation_role(target_project uuid, target_role public.project_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invitations i
    where i.project_id = target_project
      and i.role = target_role
      and i.status = 'pending'
      and i.expires_at > timezone('utc', now())
      and lower(i.email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

create or replace function public.can_view_ai_run(target_run uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.ai_runs r
      where r.id = target_run and r.user_id = auth.uid()
    )
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at before update on public.users
for each row execute function public.handle_updated_at();

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings
for each row execute function public.handle_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
for each row execute function public.handle_updated_at();

drop trigger if exists deliverables_updated_at on public.deliverables;
create trigger deliverables_updated_at before update on public.deliverables
for each row execute function public.handle_updated_at();

drop trigger if exists invitations_updated_at on public.invitations;
create trigger invitations_updated_at before update on public.invitations
for each row execute function public.handle_updated_at();

drop trigger if exists documents_updated_at on public.documents;
create trigger documents_updated_at before update on public.documents
for each row execute function public.handle_updated_at();

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at before update on public.comments
for each row execute function public.handle_updated_at();

drop trigger if exists suggestions_updated_at on public.suggestions;
create trigger suggestions_updated_at before update on public.suggestions
for each row execute function public.handle_updated_at();

drop trigger if exists library_items_updated_at on public.library_items;
create trigger library_items_updated_at before update on public.library_items
for each row execute function public.handle_updated_at();

drop trigger if exists collections_updated_at on public.collections;
create trigger collections_updated_at before update on public.collections
for each row execute function public.handle_updated_at();

drop trigger if exists ai_conversations_updated_at on public.ai_conversations;
create trigger ai_conversations_updated_at before update on public.ai_conversations
for each row execute function public.handle_updated_at();

drop trigger if exists ai_runs_updated_at on public.ai_runs;
create trigger ai_runs_updated_at before update on public.ai_runs
for each row execute function public.handle_updated_at();

drop trigger if exists ai_prompt_templates_updated_at on public.ai_prompt_templates;
create trigger ai_prompt_templates_updated_at before update on public.ai_prompt_templates
for each row execute function public.handle_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists projects_owner_membership on public.projects;
create trigger projects_owner_membership
after insert on public.projects
for each row execute function public.handle_new_project_owner_membership();

alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.deliverables enable row level security;
alter table public.invitations enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.submissions enable row level security;
alter table public.citations enable row level security;
alter table public.comments enable row level security;
alter table public.suggestions enable row level security;
alter table public.notifications enable row level security;
alter table public.library_items enable row level security;
alter table public.collections enable row level security;
alter table public.tags enable row level security;
alter table public.item_collections enable row level security;
alter table public.item_tags enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_runs enable row level security;
alter table public.ai_sources enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_saved_outputs enable row level security;
alter table public.ai_prompt_templates enable row level security;
alter table public.assets enable row level security;

alter table public.users force row level security;
alter table public.user_settings force row level security;
alter table public.audit_logs force row level security;
alter table public.projects force row level security;
alter table public.project_members force row level security;
alter table public.deliverables force row level security;
alter table public.invitations force row level security;
alter table public.documents force row level security;
alter table public.document_versions force row level security;
alter table public.submissions force row level security;
alter table public.citations force row level security;
alter table public.comments force row level security;
alter table public.suggestions force row level security;
alter table public.notifications force row level security;
alter table public.library_items force row level security;
alter table public.collections force row level security;
alter table public.tags force row level security;
alter table public.item_collections force row level security;
alter table public.item_tags force row level security;
alter table public.ai_conversations force row level security;
alter table public.ai_messages force row level security;
alter table public.ai_runs force row level security;
alter table public.ai_sources force row level security;
alter table public.ai_usage force row level security;
alter table public.ai_saved_outputs force row level security;
alter table public.ai_prompt_templates force row level security;
alter table public.assets force row level security;

drop policy if exists users_select_policy on public.users;
create policy users_select_policy on public.users
for select using (
  auth.uid() = id
  or public.is_platform_admin()
  or public.shares_project_with_user(id)
);

drop policy if exists users_update_policy on public.users;
create policy users_update_policy on public.users
for update using (
  auth.uid() = id or public.is_platform_admin()
)
with check (
  auth.uid() = id or public.is_platform_admin()
);

drop policy if exists user_settings_select_policy on public.user_settings;
create policy user_settings_select_policy on public.user_settings
for select using (
  auth.uid() = user_id or public.is_platform_admin()
);

drop policy if exists user_settings_update_policy on public.user_settings;
create policy user_settings_update_policy on public.user_settings
for update using (
  auth.uid() = user_id or public.is_platform_admin()
)
with check (
  auth.uid() = user_id or public.is_platform_admin()
);

drop policy if exists audit_logs_select_policy on public.audit_logs;
create policy audit_logs_select_policy on public.audit_logs
for select using (
  public.is_platform_admin() or actor_user_id = auth.uid()
);

drop policy if exists audit_logs_insert_policy on public.audit_logs;
create policy audit_logs_insert_policy on public.audit_logs
for insert with check (
  actor_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists projects_select_policy on public.projects;
create policy projects_select_policy on public.projects
for select using (
  public.is_platform_admin()
  or owner_user_id = auth.uid()
  or public.has_project_role(id, array['owner', 'admin', 'collaborator', 'reviewer', 'reader'])
);

drop policy if exists projects_insert_policy on public.projects;
create policy projects_insert_policy on public.projects
for insert with check (
  auth.uid() = owner_user_id
);

drop policy if exists projects_update_policy on public.projects;
create policy projects_update_policy on public.projects
for update using (
  public.can_manage_project(id)
)
with check (
  public.can_manage_project(id)
);

drop policy if exists projects_delete_policy on public.projects;
create policy projects_delete_policy on public.projects
for delete using (
  public.can_manage_project(id)
);

drop policy if exists project_members_select_policy on public.project_members;
create policy project_members_select_policy on public.project_members
for select using (
  public.can_read_project(project_id) or user_id = auth.uid()
);

drop policy if exists project_members_insert_policy on public.project_members;
create policy project_members_insert_policy on public.project_members
for insert with check (
  public.is_platform_admin()
  or public.can_manage_project(project_id)
  or (
    user_id = auth.uid()
    and public.has_pending_invitation_role(project_id, role)
  )
);

drop policy if exists project_members_update_policy on public.project_members;
create policy project_members_update_policy on public.project_members
for update using (
  public.is_platform_admin() or public.can_manage_project(project_id)
)
with check (
  public.is_platform_admin() or public.can_manage_project(project_id)
);

drop policy if exists project_members_delete_policy on public.project_members;
create policy project_members_delete_policy on public.project_members
for delete using (
  public.is_platform_admin() or public.can_manage_project(project_id)
);

drop policy if exists deliverables_select_policy on public.deliverables;
create policy deliverables_select_policy on public.deliverables
for select using (
  public.can_read_project(project_id)
);

drop policy if exists deliverables_insert_policy on public.deliverables;
create policy deliverables_insert_policy on public.deliverables
for insert with check (
  public.can_manage_deliverables(project_id)
);

drop policy if exists deliverables_update_policy on public.deliverables;
create policy deliverables_update_policy on public.deliverables
for update using (
  public.can_manage_deliverables(project_id)
)
with check (
  public.can_manage_deliverables(project_id)
);

drop policy if exists deliverables_delete_policy on public.deliverables;
create policy deliverables_delete_policy on public.deliverables
for delete using (
  public.can_manage_deliverables(project_id)
);

drop policy if exists invitations_select_policy on public.invitations;
create policy invitations_select_policy on public.invitations
for select using (
  public.can_manage_project(project_id)
  or lower(email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.is_platform_admin()
);

drop policy if exists invitations_insert_policy on public.invitations;
create policy invitations_insert_policy on public.invitations
for insert with check (
  public.can_manage_project(project_id) and invited_by = auth.uid()
);

drop policy if exists invitations_update_policy on public.invitations;
create policy invitations_update_policy on public.invitations
for update using (
  public.can_manage_project(project_id) or public.is_platform_admin()
)
with check (
  public.can_manage_project(project_id) or public.is_platform_admin()
);

drop policy if exists invitations_delete_policy on public.invitations;
create policy invitations_delete_policy on public.invitations
for delete using (
  public.can_manage_project(project_id) or public.is_platform_admin()
);

drop policy if exists documents_select_policy on public.documents;
create policy documents_select_policy on public.documents
for select using (
  public.is_platform_admin()
  or owner_user_id = auth.uid()
  or (
    project_id is not null
    and public.has_project_role(project_id, array['owner', 'admin', 'collaborator', 'reviewer', 'reader'])
  )
);

drop policy if exists documents_insert_policy on public.documents;
create policy documents_insert_policy on public.documents
for insert with check (
  owner_user_id = auth.uid()
  and (
    project_id is null
    or public.has_project_role(project_id, array['owner', 'admin', 'collaborator'])
  )
);

drop policy if exists documents_update_policy on public.documents;
create policy documents_update_policy on public.documents
for update using (
  public.can_edit_document(id)
)
with check (
  public.can_edit_document(id)
);

drop policy if exists documents_delete_policy on public.documents;
create policy documents_delete_policy on public.documents
for delete using (
  public.can_edit_document(id)
);

drop policy if exists document_versions_select_policy on public.document_versions;
create policy document_versions_select_policy on public.document_versions
for select using (
  public.can_read_document(document_id)
);

drop policy if exists document_versions_insert_policy on public.document_versions;
create policy document_versions_insert_policy on public.document_versions
for insert with check (
  created_by = auth.uid() and public.can_edit_document(document_id)
);

drop policy if exists submissions_select_policy on public.submissions;
create policy submissions_select_policy on public.submissions
for select using (
  public.can_read_document(document_id)
  or reviewer_user_id = auth.uid()
  or submitted_by = auth.uid()
);

drop policy if exists submissions_insert_policy on public.submissions;
create policy submissions_insert_policy on public.submissions
for insert with check (
  submitted_by = auth.uid() and public.can_edit_document(document_id)
);

drop policy if exists submissions_update_policy on public.submissions;
create policy submissions_update_policy on public.submissions
for update using (
  public.can_review_document(document_id)
  or reviewer_user_id = auth.uid()
  or public.is_platform_admin()
)
with check (
  public.can_review_document(document_id)
  or reviewer_user_id = auth.uid()
  or public.is_platform_admin()
);

drop policy if exists citations_select_policy on public.citations;
create policy citations_select_policy on public.citations
for select using (
  public.can_read_document(document_id)
);

drop policy if exists citations_insert_policy on public.citations;
create policy citations_insert_policy on public.citations
for insert with check (
  public.can_edit_document(document_id)
);

drop policy if exists citations_update_policy on public.citations;
create policy citations_update_policy on public.citations
for update using (
  public.can_edit_document(document_id)
)
with check (
  public.can_edit_document(document_id)
);

drop policy if exists citations_delete_policy on public.citations;
create policy citations_delete_policy on public.citations
for delete using (
  public.can_edit_document(document_id)
);

drop policy if exists comments_select_policy on public.comments;
create policy comments_select_policy on public.comments
for select using (
  public.can_read_document(document_id)
);

drop policy if exists comments_insert_policy on public.comments;
create policy comments_insert_policy on public.comments
for insert with check (
  author_user_id = auth.uid() and public.can_review_document(document_id)
);

drop policy if exists comments_update_policy on public.comments;
create policy comments_update_policy on public.comments
for update using (
  author_user_id = auth.uid()
  or public.can_edit_document(document_id)
)
with check (
  author_user_id = auth.uid()
  or public.can_edit_document(document_id)
);

drop policy if exists comments_delete_policy on public.comments;
create policy comments_delete_policy on public.comments
for delete using (
  author_user_id = auth.uid()
  or public.can_edit_document(document_id)
);

drop policy if exists suggestions_select_policy on public.suggestions;
create policy suggestions_select_policy on public.suggestions
for select using (
  public.can_read_document(document_id)
);

drop policy if exists suggestions_insert_policy on public.suggestions;
create policy suggestions_insert_policy on public.suggestions
for insert with check (
  author_user_id = auth.uid() and public.can_review_document(document_id)
);

drop policy if exists suggestions_update_policy on public.suggestions;
create policy suggestions_update_policy on public.suggestions
for update using (
  author_user_id = auth.uid()
  or public.can_edit_document(document_id)
)
with check (
  author_user_id = auth.uid()
  or public.can_edit_document(document_id)
);

drop policy if exists suggestions_delete_policy on public.suggestions;
create policy suggestions_delete_policy on public.suggestions
for delete using (
  author_user_id = auth.uid()
  or public.can_edit_document(document_id)
);

drop policy if exists notifications_select_policy on public.notifications;
create policy notifications_select_policy on public.notifications
for select using (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists notifications_insert_policy on public.notifications;
create policy notifications_insert_policy on public.notifications
for insert with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists notifications_update_policy on public.notifications;
create policy notifications_update_policy on public.notifications
for update using (
  user_id = auth.uid() or public.is_platform_admin()
)
with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists notifications_delete_policy on public.notifications;
create policy notifications_delete_policy on public.notifications
for delete using (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists library_items_select_policy on public.library_items;
create policy library_items_select_policy on public.library_items
for select using (
  public.is_platform_admin()
  or owner_user_id = auth.uid()
  or (project_id is not null and public.can_read_project(project_id))
);

drop policy if exists library_items_insert_policy on public.library_items;
create policy library_items_insert_policy on public.library_items
for insert with check (
  owner_user_id = auth.uid()
  and (
    project_id is null
    or public.has_project_role(project_id, array['owner', 'admin', 'collaborator'])
  )
);

drop policy if exists library_items_update_policy on public.library_items;
create policy library_items_update_policy on public.library_items
for update using (
  public.can_edit_library_item(id)
)
with check (
  public.can_edit_library_item(id)
);

drop policy if exists library_items_delete_policy on public.library_items;
create policy library_items_delete_policy on public.library_items
for delete using (
  public.can_edit_library_item(id)
);

drop policy if exists collections_select_policy on public.collections;
create policy collections_select_policy on public.collections
for select using (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists collections_insert_policy on public.collections;
create policy collections_insert_policy on public.collections
for insert with check (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists collections_update_policy on public.collections;
create policy collections_update_policy on public.collections
for update using (
  owner_user_id = auth.uid() or public.is_platform_admin()
)
with check (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists collections_delete_policy on public.collections;
create policy collections_delete_policy on public.collections
for delete using (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists tags_select_policy on public.tags;
create policy tags_select_policy on public.tags
for select using (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists tags_insert_policy on public.tags;
create policy tags_insert_policy on public.tags
for insert with check (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists tags_update_policy on public.tags;
create policy tags_update_policy on public.tags
for update using (
  owner_user_id = auth.uid() or public.is_platform_admin()
)
with check (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists tags_delete_policy on public.tags;
create policy tags_delete_policy on public.tags
for delete using (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists item_collections_select_policy on public.item_collections;
create policy item_collections_select_policy on public.item_collections
for select using (
  public.can_edit_library_item(item_id)
);

drop policy if exists item_collections_insert_policy on public.item_collections;
create policy item_collections_insert_policy on public.item_collections
for insert with check (
  public.can_edit_library_item(item_id)
  and exists (
    select 1 from public.collections c
    where c.id = collection_id and (c.owner_user_id = auth.uid() or public.is_platform_admin())
  )
);

drop policy if exists item_collections_delete_policy on public.item_collections;
create policy item_collections_delete_policy on public.item_collections
for delete using (
  public.can_edit_library_item(item_id)
);

drop policy if exists item_tags_select_policy on public.item_tags;
create policy item_tags_select_policy on public.item_tags
for select using (
  public.can_edit_library_item(item_id)
);

drop policy if exists item_tags_insert_policy on public.item_tags;
create policy item_tags_insert_policy on public.item_tags
for insert with check (
  public.can_edit_library_item(item_id)
  and exists (
    select 1 from public.tags t
    where t.id = tag_id and (t.owner_user_id = auth.uid() or public.is_platform_admin())
  )
);

drop policy if exists item_tags_delete_policy on public.item_tags;
create policy item_tags_delete_policy on public.item_tags
for delete using (
  public.can_edit_library_item(item_id)
);

drop policy if exists ai_conversations_select_policy on public.ai_conversations;
create policy ai_conversations_select_policy on public.ai_conversations
for select using (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_conversations_insert_policy on public.ai_conversations;
create policy ai_conversations_insert_policy on public.ai_conversations
for insert with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_conversations_update_policy on public.ai_conversations;
create policy ai_conversations_update_policy on public.ai_conversations
for update using (
  user_id = auth.uid() or public.is_platform_admin()
)
with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_messages_select_policy on public.ai_messages;
create policy ai_messages_select_policy on public.ai_messages
for select using (
  exists (
    select 1
    from public.ai_conversations c
    where c.id = conversation_id and (c.user_id = auth.uid() or public.is_platform_admin())
  )
);

drop policy if exists ai_messages_insert_policy on public.ai_messages;
create policy ai_messages_insert_policy on public.ai_messages
for insert with check (
  exists (
    select 1
    from public.ai_conversations c
    where c.id = conversation_id and (c.user_id = auth.uid() or public.is_platform_admin())
  )
);

drop policy if exists ai_runs_select_policy on public.ai_runs;
create policy ai_runs_select_policy on public.ai_runs
for select using (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_runs_insert_policy on public.ai_runs;
create policy ai_runs_insert_policy on public.ai_runs
for insert with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_runs_update_policy on public.ai_runs;
create policy ai_runs_update_policy on public.ai_runs
for update using (
  user_id = auth.uid() or public.is_platform_admin()
)
with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_sources_select_policy on public.ai_sources;
create policy ai_sources_select_policy on public.ai_sources
for select using (
  public.can_view_ai_run(run_id)
);

drop policy if exists ai_sources_insert_policy on public.ai_sources;
create policy ai_sources_insert_policy on public.ai_sources
for insert with check (
  public.can_view_ai_run(run_id)
);

drop policy if exists ai_usage_select_policy on public.ai_usage;
create policy ai_usage_select_policy on public.ai_usage
for select using (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_usage_insert_policy on public.ai_usage;
create policy ai_usage_insert_policy on public.ai_usage
for insert with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_usage_update_policy on public.ai_usage;
create policy ai_usage_update_policy on public.ai_usage
for update using (
  user_id = auth.uid() or public.is_platform_admin()
)
with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_saved_outputs_select_policy on public.ai_saved_outputs;
create policy ai_saved_outputs_select_policy on public.ai_saved_outputs
for select using (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_saved_outputs_insert_policy on public.ai_saved_outputs;
create policy ai_saved_outputs_insert_policy on public.ai_saved_outputs
for insert with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_saved_outputs_update_policy on public.ai_saved_outputs;
create policy ai_saved_outputs_update_policy on public.ai_saved_outputs
for update using (
  user_id = auth.uid() or public.is_platform_admin()
)
with check (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_saved_outputs_delete_policy on public.ai_saved_outputs;
create policy ai_saved_outputs_delete_policy on public.ai_saved_outputs
for delete using (
  user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_prompt_templates_select_policy on public.ai_prompt_templates;
create policy ai_prompt_templates_select_policy on public.ai_prompt_templates
for select using (
  is_system = true or owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_prompt_templates_insert_policy on public.ai_prompt_templates;
create policy ai_prompt_templates_insert_policy on public.ai_prompt_templates
for insert with check (
  (owner_user_id = auth.uid() and is_system = false)
  or public.is_platform_admin()
);

drop policy if exists ai_prompt_templates_update_policy on public.ai_prompt_templates;
create policy ai_prompt_templates_update_policy on public.ai_prompt_templates
for update using (
  owner_user_id = auth.uid() or public.is_platform_admin()
)
with check (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists ai_prompt_templates_delete_policy on public.ai_prompt_templates;
create policy ai_prompt_templates_delete_policy on public.ai_prompt_templates
for delete using (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists assets_select_policy on public.assets;
create policy assets_select_policy on public.assets
for select using (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists assets_insert_policy on public.assets;
create policy assets_insert_policy on public.assets
for insert with check (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists assets_update_policy on public.assets;
create policy assets_update_policy on public.assets
for update using (
  owner_user_id = auth.uid() or public.is_platform_admin()
)
with check (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists assets_delete_policy on public.assets;
create policy assets_delete_policy on public.assets
for delete using (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists avatars_select_policy on storage.objects;
create policy avatars_select_policy on storage.objects
for select using (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_platform_admin()
  )
);

drop policy if exists avatars_insert_policy on storage.objects;
create policy avatars_insert_policy on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists avatars_update_policy on storage.objects;
create policy avatars_update_policy on storage.objects
for update using (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_platform_admin()
  )
)
with check (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_platform_admin()
  )
);

drop policy if exists avatars_delete_policy on storage.objects;
create policy avatars_delete_policy on storage.objects
for delete using (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_platform_admin()
  )
);

drop policy if exists documents_select_policy on storage.objects;
create policy documents_select_policy on storage.objects
for select using (
  bucket_id = 'documents'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_platform_admin()
  )
);

drop policy if exists documents_insert_policy on storage.objects;
create policy documents_insert_policy on storage.objects
for insert with check (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists documents_update_policy on storage.objects;
create policy documents_update_policy on storage.objects
for update using (
  bucket_id = 'documents'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_platform_admin()
  )
)
with check (
  bucket_id = 'documents'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_platform_admin()
  )
);

drop policy if exists documents_delete_policy on storage.objects;
create policy documents_delete_policy on storage.objects
for delete using (
  bucket_id = 'documents'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_platform_admin()
  )
);
