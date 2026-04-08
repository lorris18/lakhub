begin;

create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
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

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  library_item_id uuid references public.library_items(id) on delete set null,
  bucket text not null,
  path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bucket, path)
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  provider text not null check (provider in ('claude', 'perplexity')),
  mode text not null check (mode in ('auto', 'writing', 'research', 'critique', 'compare')),
  title text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  provider text not null check (provider in ('claude', 'perplexity')),
  mode text not null check (mode in ('auto', 'writing', 'research', 'critique', 'compare')),
  prompt text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  output text,
  error_message text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table if not exists public.ai_sources (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_runs(id) on delete cascade,
  title text not null,
  url text not null,
  snippet text,
  source_rank integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('claude', 'perplexity')),
  usage_date date not null default current_date,
  request_count integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
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

alter table public.users add column if not exists avatar_path text;
update public.users
set avatar_path = coalesce(avatar_path, avatar_url)
where avatar_path is null and avatar_url is not null;

alter table public.projects add column if not exists owner_user_id uuid references public.users(id) on delete set null;
alter table public.projects add column if not exists problem_statement text;
alter table public.projects add column if not exists due_date date;
update public.projects
set owner_user_id = coalesce(owner_user_id, created_by),
    problem_statement = coalesce(problem_statement, research_question),
    due_date = coalesce(due_date, end_date)
where owner_user_id is null
   or problem_statement is null
   or due_date is null;

alter table public.project_members add column if not exists joined_at timestamptz;
update public.project_members
set joined_at = coalesce(joined_at, accepted_at, invited_at, timezone('utc', now()))
where joined_at is null;

alter table public.invitations add column if not exists status text default 'pending';
update public.invitations
set status = case
  when accepted_at is not null then 'accepted'
  when expires_at < timezone('utc', now()) then 'expired'
  else coalesce(status, 'pending')
end;

alter table public.documents add column if not exists owner_user_id uuid references public.users(id) on delete set null;
alter table public.documents add column if not exists kind text;
alter table public.documents add column if not exists content_json jsonb;
alter table public.documents add column if not exists plain_text text;
alter table public.documents add column if not exists last_edited_at timestamptz;
update public.documents
set owner_user_id = coalesce(owner_user_id, created_by),
    kind = coalesce(kind, lower(type::text)),
    content_json = coalesce(content_json, content),
    plain_text = coalesce(plain_text, ''),
    last_edited_at = coalesce(last_edited_at, updated_at)
where owner_user_id is null
   or kind is null
   or content_json is null
   or plain_text is null
   or last_edited_at is null;

alter table public.document_versions add column if not exists title text;
alter table public.document_versions add column if not exists summary text;
alter table public.document_versions add column if not exists content_json jsonb;
update public.document_versions
set title = coalesce(title, title_snapshot),
    summary = coalesce(summary, message),
    content_json = coalesce(content_json, content_snapshot)
where title is null
   or summary is null
   or content_json is null;

alter table public.submissions add column if not exists submitted_by uuid references public.users(id) on delete set null;
alter table public.submissions add column if not exists reviewer_user_id uuid references public.users(id) on delete set null;
alter table public.submissions add column if not exists note text;
alter table public.submissions add column if not exists submitted_at timestamptz;
update public.submissions
set submitted_by = coalesce(submitted_by, submitted_by_id),
    reviewer_user_id = coalesce(reviewer_user_id, submitted_to_id),
    note = coalesce(note, message),
    submitted_at = coalesce(submitted_at, created_at)
where submitted_by is null
   or reviewer_user_id is null
   or note is null
   or submitted_at is null;

alter table public.citations add column if not exists citation_key text;
alter table public.citations add column if not exists locator text;
alter table public.citations add column if not exists note text;
update public.citations
set citation_key = coalesce(citation_key, nullif(raw_citation, ''), concat('cit-', left(id::text, 8))),
    locator = coalesce(locator, null),
    note = coalesce(note, null)
where citation_key is null;

alter table public.comments add column if not exists body text;
alter table public.comments add column if not exists anchor_id text;
alter table public.comments add column if not exists author_user_id uuid references public.users(id) on delete set null;
alter table public.comments add column if not exists version_id uuid references public.document_versions(id) on delete set null;
update public.comments
set body = coalesce(body, content),
    anchor_id = coalesce(anchor_id, nullif(anchor_text, ''), concat('comment-', left(id::text, 8))),
    author_user_id = coalesce(author_user_id, author_id)
where body is null
   or anchor_id is null
   or author_user_id is null;

alter table public.suggestions add column if not exists proposed_text text;
alter table public.suggestions add column if not exists anchor_id text;
alter table public.suggestions add column if not exists author_user_id uuid references public.users(id) on delete set null;
alter table public.suggestions add column if not exists version_id uuid references public.document_versions(id) on delete set null;
update public.suggestions
set proposed_text = coalesce(proposed_text, suggested_text),
    anchor_id = coalesce(anchor_id, concat('suggestion-', left(id::text, 8))),
    author_user_id = coalesce(author_user_id, author_id)
where proposed_text is null
   or anchor_id is null
   or author_user_id is null;

alter table public.library_items add column if not exists owner_user_id uuid references public.users(id) on delete cascade;
alter table public.library_items add column if not exists publication_year integer;
alter table public.library_items add column if not exists item_type text;
alter table public.library_items add column if not exists summary text;
alter table public.library_items add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.library_items add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.library_items add column if not exists url text;
update public.library_items
set owner_user_id = coalesce(owner_user_id, user_id),
    publication_year = coalesce(publication_year, year),
    item_type = coalesce(
      item_type,
      case type::text
        when 'PDF' then 'pdf'
        when 'DOCX' then 'docx'
        when 'NOTE' then 'note'
        when 'BOOK' then 'book'
        when 'WEBPAGE' then 'web'
        else 'article'
      end
    ),
    summary = coalesce(summary, abstract, notes),
    metadata = case
      when metadata is null or metadata = '{}'::jsonb then
        jsonb_strip_nulls(jsonb_build_object(
          'legacy_file_url', file_url,
          'legacy_content_text', content_text
        ))
      else metadata
    end,
    url = coalesce(url, file_url)
where owner_user_id is null
   or publication_year is null
   or item_type is null
   or summary is null
   or metadata is null
   or url is null;

alter table public.collections add column if not exists owner_user_id uuid references public.users(id) on delete cascade;
alter table public.collections add column if not exists updated_at timestamptz not null default timezone('utc', now());
update public.collections
set owner_user_id = coalesce(owner_user_id, user_id),
    updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where owner_user_id is null
   or updated_at is null;

alter table public.tags add column if not exists owner_user_id uuid references public.users(id) on delete cascade;
update public.tags
set owner_user_id = coalesce(owner_user_id, user_id)
where owner_user_id is null;

alter table public.item_collections add column if not exists item_id uuid references public.library_items(id) on delete cascade;
update public.item_collections
set item_id = coalesce(item_id, library_item_id)
where item_id is null;

alter table public.item_tags add column if not exists item_id uuid references public.library_items(id) on delete cascade;
update public.item_tags
set item_id = coalesce(item_id, library_item_id)
where item_id is null;

insert into public.user_settings (user_id)
select u.id
from public.users u
left join public.user_settings s on s.user_id = u.id
where s.user_id is null;

create index if not exists idx_assets_owner_user_id on public.assets(owner_user_id);
create index if not exists idx_assets_document_id on public.assets(document_id);
create index if not exists idx_assets_library_item_id on public.assets(library_item_id);
create index if not exists idx_ai_conversations_user_id on public.ai_conversations(user_id);
create index if not exists idx_ai_runs_user_id on public.ai_runs(user_id);
create index if not exists idx_ai_sources_run_id on public.ai_sources(run_id);
create index if not exists idx_ai_usage_user_provider_date on public.ai_usage(user_id, provider, usage_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_user_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.avatar_path = coalesce(new.avatar_path, new.avatar_url);
  new.avatar_url = coalesce(new.avatar_url, new.avatar_path);
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_project_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.owner_user_id = coalesce(new.owner_user_id, new.created_by, auth.uid());
  new.created_by = coalesce(new.created_by, new.owner_user_id, auth.uid());
  new.problem_statement = coalesce(new.problem_statement, new.research_question);
  new.research_question = coalesce(new.research_question, new.problem_statement);
  new.due_date = coalesce(new.due_date, new.end_date);
  new.end_date = coalesce(new.end_date, new.due_date);
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_project_member_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.joined_at = coalesce(new.joined_at, new.accepted_at, new.invited_at, timezone('utc', now()));
  new.accepted_at = coalesce(new.accepted_at, new.joined_at, timezone('utc', now()));
  return new;
end;
$$;

create or replace function public.sync_invitation_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.status = case
    when new.accepted_at is not null then 'accepted'
    when new.expires_at is not null and new.expires_at < timezone('utc', now()) then 'expired'
    else coalesce(new.status, 'pending')
  end;
  return new;
end;
$$;

create or replace function public.sync_document_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.owner_user_id = coalesce(new.owner_user_id, new.created_by, auth.uid());
  new.created_by = coalesce(new.created_by, new.owner_user_id, auth.uid());
  new.kind = coalesce(new.kind, lower(new.type::text));
  if new.type is null and new.kind is not null then
    new.type = case lower(new.kind)
      when 'article' then 'ARTICLE'::public.document_type
      when 'thesis' then 'THESIS'::public.document_type
      when 'chapter' then 'CHAPTER'::public.document_type
      when 'note' then 'NOTE'::public.document_type
      else 'REPORT'::public.document_type
    end;
  end if;
  new.content_json = coalesce(new.content_json, new.content, '{}'::jsonb);
  new.content = coalesce(new.content, new.content_json, '{}'::jsonb);
  new.plain_text = coalesce(new.plain_text, '');
  new.last_edited_at = timezone('utc', now());
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_document_version_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.title = coalesce(new.title, new.title_snapshot);
  new.title_snapshot = coalesce(new.title_snapshot, new.title);
  new.summary = coalesce(new.summary, new.message);
  new.message = coalesce(new.message, new.summary);
  new.content_json = coalesce(new.content_json, new.content_snapshot, '{}'::jsonb);
  new.content_snapshot = coalesce(new.content_snapshot, new.content_json, '{}'::jsonb);
  return new;
end;
$$;

create or replace function public.sync_submission_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.submitted_by = coalesce(new.submitted_by, new.submitted_by_id, auth.uid());
  new.submitted_by_id = coalesce(new.submitted_by_id, new.submitted_by, auth.uid());
  new.reviewer_user_id = coalesce(new.reviewer_user_id, new.submitted_to_id);
  new.submitted_to_id = coalesce(new.submitted_to_id, new.reviewer_user_id);
  new.note = coalesce(new.note, new.message);
  new.message = coalesce(new.message, new.note);
  new.submitted_at = coalesce(new.submitted_at, new.created_at, timezone('utc', now()));
  new.created_at = coalesce(new.created_at, new.submitted_at, timezone('utc', now()));
  return new;
end;
$$;

create or replace function public.sync_comment_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.author_user_id = coalesce(new.author_user_id, new.author_id, auth.uid());
  new.author_id = coalesce(new.author_id, new.author_user_id, auth.uid());
  new.body = coalesce(new.body, new.content);
  new.content = coalesce(new.content, new.body);
  new.anchor_id = coalesce(new.anchor_id, nullif(new.anchor_text, ''), concat('comment-', left(new.id::text, 8)));
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_suggestion_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.author_user_id = coalesce(new.author_user_id, new.author_id, auth.uid());
  new.author_id = coalesce(new.author_id, new.author_user_id, auth.uid());
  new.proposed_text = coalesce(new.proposed_text, new.suggested_text);
  new.suggested_text = coalesce(new.suggested_text, new.proposed_text);
  new.anchor_id = coalesce(new.anchor_id, concat('suggestion-', left(new.id::text, 8)));
  return new;
end;
$$;

create or replace function public.sync_library_item_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.owner_user_id = coalesce(new.owner_user_id, new.user_id, auth.uid());
  new.user_id = coalesce(new.user_id, new.owner_user_id, auth.uid());
  new.publication_year = coalesce(new.publication_year, new.year);
  new.year = coalesce(new.year, new.publication_year);
  new.summary = coalesce(new.summary, new.abstract, new.notes);
  new.item_type = coalesce(new.item_type, case new.type::text
    when 'PDF' then 'pdf'
    when 'DOCX' then 'docx'
    when 'NOTE' then 'note'
    when 'BOOK' then 'book'
    when 'WEBPAGE' then 'web'
    else 'article'
  end);
  if new.type is null and new.item_type is not null then
    new.type = case lower(new.item_type)
      when 'pdf' then 'PDF'::public.library_item_type
      when 'docx' then 'DOCX'::public.library_item_type
      when 'note' then 'NOTE'::public.library_item_type
      when 'book' then 'BOOK'::public.library_item_type
      when 'web' then 'WEBPAGE'::public.library_item_type
      else 'JOURNAL_ARTICLE'::public.library_item_type
    end;
  end if;
  new.url = coalesce(new.url, new.file_url);
  new.file_url = coalesce(new.file_url, new.url);
  new.metadata = coalesce(new.metadata, '{}'::jsonb);
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_collection_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.owner_user_id = coalesce(new.owner_user_id, new.user_id, auth.uid());
  new.user_id = coalesce(new.user_id, new.owner_user_id, auth.uid());
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_tag_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.owner_user_id = coalesce(new.owner_user_id, new.user_id, auth.uid());
  new.user_id = coalesce(new.user_id, new.owner_user_id, auth.uid());
  return new;
end;
$$;

create or replace function public.sync_item_collection_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.item_id = coalesce(new.item_id, new.library_item_id);
  new.library_item_id = coalesce(new.library_item_id, new.item_id);
  return new;
end;
$$;

create or replace function public.sync_item_tag_columns()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  new.item_id = coalesce(new.item_id, new.library_item_id);
  new.library_item_id = coalesce(new.library_item_id, new.item_id);
  return new;
end;
$$;

drop trigger if exists trg_sync_users on public.users;
create trigger trg_sync_users before insert or update on public.users for each row execute function public.sync_user_columns();

drop trigger if exists trg_sync_projects on public.projects;
create trigger trg_sync_projects before insert or update on public.projects for each row execute function public.sync_project_columns();

drop trigger if exists trg_sync_project_members on public.project_members;
create trigger trg_sync_project_members before insert or update on public.project_members for each row execute function public.sync_project_member_columns();

drop trigger if exists trg_sync_invitations on public.invitations;
create trigger trg_sync_invitations before insert or update on public.invitations for each row execute function public.sync_invitation_columns();

drop trigger if exists trg_sync_documents on public.documents;
create trigger trg_sync_documents before insert or update on public.documents for each row execute function public.sync_document_columns();

drop trigger if exists trg_sync_document_versions on public.document_versions;
create trigger trg_sync_document_versions before insert or update on public.document_versions for each row execute function public.sync_document_version_columns();

drop trigger if exists trg_sync_submissions on public.submissions;
create trigger trg_sync_submissions before insert or update on public.submissions for each row execute function public.sync_submission_columns();

drop trigger if exists trg_sync_comments on public.comments;
create trigger trg_sync_comments before insert or update on public.comments for each row execute function public.sync_comment_columns();

drop trigger if exists trg_sync_suggestions on public.suggestions;
create trigger trg_sync_suggestions before insert or update on public.suggestions for each row execute function public.sync_suggestion_columns();

drop trigger if exists trg_sync_library_items on public.library_items;
create trigger trg_sync_library_items before insert or update on public.library_items for each row execute function public.sync_library_item_columns();

drop trigger if exists trg_sync_collections on public.collections;
create trigger trg_sync_collections before insert or update on public.collections for each row execute function public.sync_collection_columns();

drop trigger if exists trg_sync_tags on public.tags;
create trigger trg_sync_tags before insert or update on public.tags for each row execute function public.sync_tag_columns();

drop trigger if exists trg_sync_item_collections on public.item_collections;
create trigger trg_sync_item_collections before insert or update on public.item_collections for each row execute function public.sync_item_collection_columns();

drop trigger if exists trg_sync_item_tags on public.item_tags;
create trigger trg_sync_item_tags before insert or update on public.item_tags for each row execute function public.sync_item_tag_columns();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'user',
    true,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.users.full_name, excluded.full_name),
        updated_at = timezone('utc', now());

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

alter table public.user_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.assets enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_runs enable row level security;
alter table public.ai_sources enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_saved_outputs enable row level security;
alter table public.ai_prompt_templates enable row level security;

drop policy if exists users_select on public.users;
create policy users_select on public.users
for select
using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.project_members viewer
    join public.project_members subject
      on subject.project_id = viewer.project_id
    where viewer.user_id = auth.uid()
      and subject.user_id = users.id
      and viewer.accepted_at is not null
      and subject.accepted_at is not null
  )
);

drop policy if exists user_settings_select on public.user_settings;
create policy user_settings_select on public.user_settings
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_settings_insert on public.user_settings;
create policy user_settings_insert on public.user_settings
for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists user_settings_update on public.user_settings;
create policy user_settings_update on public.user_settings
for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
for select using (actor_user_id = auth.uid() or public.is_admin());

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
for insert with check (actor_user_id = auth.uid() or actor_user_id is null or public.is_admin());

drop policy if exists assets_select on public.assets;
create policy assets_select on public.assets
for select using (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists assets_insert on public.assets;
create policy assets_insert on public.assets
for insert with check (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists assets_update on public.assets;
create policy assets_update on public.assets
for update using (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists assets_delete on public.assets;
create policy assets_delete on public.assets
for delete using (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists ai_conversations_select on public.ai_conversations;
create policy ai_conversations_select on public.ai_conversations
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_conversations_insert on public.ai_conversations;
create policy ai_conversations_insert on public.ai_conversations
for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_conversations_update on public.ai_conversations;
create policy ai_conversations_update on public.ai_conversations
for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_messages_select on public.ai_messages;
create policy ai_messages_select on public.ai_messages
for select using (
  exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and (c.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists ai_messages_insert on public.ai_messages;
create policy ai_messages_insert on public.ai_messages
for insert with check (
  exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and (c.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists ai_runs_select on public.ai_runs;
create policy ai_runs_select on public.ai_runs
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_runs_insert on public.ai_runs;
create policy ai_runs_insert on public.ai_runs
for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_runs_update on public.ai_runs;
create policy ai_runs_update on public.ai_runs
for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_sources_select on public.ai_sources;
create policy ai_sources_select on public.ai_sources
for select using (
  exists (
    select 1 from public.ai_runs r
    where r.id = ai_sources.run_id
      and (r.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists ai_sources_insert on public.ai_sources;
create policy ai_sources_insert on public.ai_sources
for insert with check (
  exists (
    select 1 from public.ai_runs r
    where r.id = ai_sources.run_id
      and (r.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_usage_insert on public.ai_usage;
create policy ai_usage_insert on public.ai_usage
for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_usage_update on public.ai_usage;
create policy ai_usage_update on public.ai_usage
for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_saved_outputs_select on public.ai_saved_outputs;
create policy ai_saved_outputs_select on public.ai_saved_outputs
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_saved_outputs_insert on public.ai_saved_outputs;
create policy ai_saved_outputs_insert on public.ai_saved_outputs
for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_prompt_templates_select on public.ai_prompt_templates;
create policy ai_prompt_templates_select on public.ai_prompt_templates
for select using (owner_user_id = auth.uid() or owner_user_id is null or public.is_admin());

drop policy if exists ai_prompt_templates_insert on public.ai_prompt_templates;
create policy ai_prompt_templates_insert on public.ai_prompt_templates
for insert with check (owner_user_id = auth.uid() or owner_user_id is null or public.is_admin());

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

commit;
