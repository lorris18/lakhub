begin;

create or replace function public.ensure_project_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_owner uuid;
begin
  v_owner := coalesce(new.owner_user_id, new.created_by);

  if v_owner is not null then
    insert into public.project_members (
      project_id,
      user_id,
      role,
      invited_by,
      invited_at,
      accepted_at,
      joined_at
    )
    values (
      new.id,
      v_owner,
      'OWNER'::public.member_role,
      v_owner,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    )
    on conflict (project_id, user_id) do update
      set role = 'OWNER'::public.member_role,
          accepted_at = coalesce(public.project_members.accepted_at, excluded.accepted_at),
          joined_at = coalesce(public.project_members.joined_at, excluded.joined_at);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_project_owner_membership on public.projects;
create trigger trg_project_owner_membership
after insert or update on public.projects
for each row execute function public.ensure_project_owner_membership();

drop policy if exists proj_insert on public.projects;
create policy proj_insert on public.projects
for insert
with check (coalesce(owner_user_id, created_by) = auth.uid());

drop policy if exists proj_select on public.projects;
create policy proj_select on public.projects
for select
using (
  is_project_member(id, 'READER'::text)
  or coalesce(owner_user_id, created_by) = auth.uid()
);

drop policy if exists proj_update on public.projects;
create policy proj_update on public.projects
for update
using (
  is_project_member(id, 'ADMIN'::text)
  or coalesce(owner_user_id, created_by) = auth.uid()
);

drop policy if exists proj_delete on public.projects;
create policy proj_delete on public.projects
for delete
using (
  is_project_member(id, 'OWNER'::text)
  or coalesce(owner_user_id, created_by) = auth.uid()
);

drop policy if exists doc_insert on public.documents;
create policy doc_insert on public.documents
for insert
with check (coalesce(owner_user_id, created_by) = auth.uid());

drop policy if exists doc_select on public.documents;
create policy doc_select on public.documents
for select
using (
  coalesce(owner_user_id, created_by) = auth.uid()
  or (project_id is not null and is_project_member(project_id, 'READER'::text))
);

drop policy if exists doc_update on public.documents;
create policy doc_update on public.documents
for update
using (
  coalesce(owner_user_id, created_by) = auth.uid()
  or (project_id is not null and is_project_member(project_id, 'COLLABORATOR'::text))
);

drop policy if exists doc_delete on public.documents;
create policy doc_delete on public.documents
for delete
using (coalesce(owner_user_id, created_by) = auth.uid());

drop policy if exists dv_insert on public.document_versions;
create policy dv_insert on public.document_versions
for insert
with check (
  created_by = auth.uid()
  and document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
       or (documents.project_id is not null and is_project_member(documents.project_id, 'COLLABORATOR'::text))
  )
);

drop policy if exists dv_select on public.document_versions;
create policy dv_select on public.document_versions
for select
using (
  document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
       or (documents.project_id is not null and is_project_member(documents.project_id, 'READER'::text))
  )
);

drop policy if exists cit_select on public.citations;
create policy cit_select on public.citations
for select
using (
  document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
       or (documents.project_id is not null and is_project_member(documents.project_id, 'READER'::text))
  )
);

drop policy if exists cit_insert on public.citations;
create policy cit_insert on public.citations
for insert
with check (
  document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
  )
);

drop policy if exists cit_delete on public.citations;
create policy cit_delete on public.citations
for delete
using (
  document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
  )
);

drop policy if exists cmt_insert on public.comments;
create policy cmt_insert on public.comments
for insert
with check (
  coalesce(author_user_id, author_id) = auth.uid()
  and document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
       or (documents.project_id is not null and is_project_member(documents.project_id, 'READER'::text))
  )
);

drop policy if exists cmt_select on public.comments;
create policy cmt_select on public.comments
for select
using (
  document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
       or (documents.project_id is not null and is_project_member(documents.project_id, 'READER'::text))
  )
);

drop policy if exists cmt_update on public.comments;
create policy cmt_update on public.comments
for update
using (
  coalesce(author_user_id, author_id) = auth.uid()
  or document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
  )
);

drop policy if exists cmt_delete on public.comments;
create policy cmt_delete on public.comments
for delete
using (coalesce(author_user_id, author_id) = auth.uid());

drop policy if exists sug_insert on public.suggestions;
create policy sug_insert on public.suggestions
for insert
with check (
  coalesce(author_user_id, author_id) = auth.uid()
  and document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
       or (documents.project_id is not null and is_project_member(documents.project_id, 'REVIEWER'::text))
  )
);

drop policy if exists sug_select on public.suggestions;
create policy sug_select on public.suggestions
for select
using (
  document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
       or (documents.project_id is not null and is_project_member(documents.project_id, 'READER'::text))
  )
);

drop policy if exists sug_update on public.suggestions;
create policy sug_update on public.suggestions
for update
using (
  coalesce(author_user_id, author_id) = auth.uid()
  or reviewed_by_id = auth.uid()
  or document_id in (
    select documents.id
    from public.documents
    where coalesce(documents.owner_user_id, documents.created_by) = auth.uid()
  )
);

drop policy if exists sug_delete on public.suggestions;
create policy sug_delete on public.suggestions
for delete
using (coalesce(author_user_id, author_id) = auth.uid());

drop policy if exists lib_insert on public.library_items;
create policy lib_insert on public.library_items
for insert
with check (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists lib_select on public.library_items;
create policy lib_select on public.library_items
for select
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists lib_update on public.library_items;
create policy lib_update on public.library_items
for update
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists lib_delete on public.library_items;
create policy lib_delete on public.library_items
for delete
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists col_insert on public.collections;
create policy col_insert on public.collections
for insert
with check (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists col_select on public.collections;
create policy col_select on public.collections
for select
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists col_update on public.collections;
create policy col_update on public.collections
for update
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists col_delete on public.collections;
create policy col_delete on public.collections
for delete
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists tag_insert on public.tags;
create policy tag_insert on public.tags
for insert
with check (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists tag_select on public.tags;
create policy tag_select on public.tags
for select
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists tag_update on public.tags;
create policy tag_update on public.tags
for update
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists tag_delete on public.tags;
create policy tag_delete on public.tags
for delete
using (coalesce(owner_user_id, user_id) = auth.uid());

drop policy if exists ic_insert on public.item_collections;
create policy ic_insert on public.item_collections
for insert
with check (
  coalesce(item_id, library_item_id) in (
    select id from public.library_items where coalesce(owner_user_id, user_id) = auth.uid()
  )
);

drop policy if exists ic_select on public.item_collections;
create policy ic_select on public.item_collections
for select
using (
  coalesce(item_id, library_item_id) in (
    select id from public.library_items where coalesce(owner_user_id, user_id) = auth.uid()
  )
);

drop policy if exists ic_delete on public.item_collections;
create policy ic_delete on public.item_collections
for delete
using (
  coalesce(item_id, library_item_id) in (
    select id from public.library_items where coalesce(owner_user_id, user_id) = auth.uid()
  )
);

drop policy if exists it_insert on public.item_tags;
create policy it_insert on public.item_tags
for insert
with check (
  coalesce(item_id, library_item_id) in (
    select id from public.library_items where coalesce(owner_user_id, user_id) = auth.uid()
  )
);

drop policy if exists it_select on public.item_tags;
create policy it_select on public.item_tags
for select
using (
  coalesce(item_id, library_item_id) in (
    select id from public.library_items where coalesce(owner_user_id, user_id) = auth.uid()
  )
);

drop policy if exists it_delete on public.item_tags;
create policy it_delete on public.item_tags
for delete
using (
  coalesce(item_id, library_item_id) in (
    select id from public.library_items where coalesce(owner_user_id, user_id) = auth.uid()
  )
);

drop policy if exists sub_insert on public.submissions;
create policy sub_insert on public.submissions
for insert
with check (coalesce(submitted_by, submitted_by_id) = auth.uid());

drop policy if exists sub_read on public.submissions;
create policy sub_read on public.submissions
for select
using (
  coalesce(submitted_by, submitted_by_id) = auth.uid()
  or coalesce(reviewer_user_id, submitted_to_id) = auth.uid()
);

drop policy if exists sub_update on public.submissions;
create policy sub_update on public.submissions
for update
using (coalesce(reviewer_user_id, submitted_to_id) = auth.uid());

commit;
