drop policy if exists projects_select_policy on public.projects;
create policy projects_select_policy on public.projects
for select using (
  public.is_platform_admin()
  or owner_user_id = auth.uid()
  or public.has_project_role(id, array['owner', 'admin', 'collaborator', 'reviewer', 'reader'])
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

drop policy if exists library_items_select_policy on public.library_items;
create policy library_items_select_policy on public.library_items
for select using (
  public.is_platform_admin()
  or owner_user_id = auth.uid()
  or (project_id is not null and public.can_read_project(project_id))
);
