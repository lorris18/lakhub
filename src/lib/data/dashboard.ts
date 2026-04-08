import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  dbDeliverableStatusToApp,
  dbDocumentStatusToApp,
  dbProjectStatusToApp
} from "@/lib/data/db-mappers";
import { requireUser } from "@/lib/data/helpers";

export async function getDashboardSnapshot() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [projects, documents, notifications, upcomingDeliverables] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, status, due_date, updated_at")
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("documents")
      .select("id, title, kind, status, updated_at, project_id")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("id, title, body, type, created_at, read_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("deliverables")
      .select("id, title, due_date, status, project_id")
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(5)
  ]);

  if (projects.error) throw projects.error;
  if (documents.error) throw documents.error;
  if (notifications.error) throw notifications.error;
  if (upcomingDeliverables.error) throw upcomingDeliverables.error;

  return {
    projects: projects.data.map((project) => ({
      ...project,
      status: dbProjectStatusToApp(project.status)
    })),
    documents: documents.data.map((document) => ({
      ...document,
      status: dbDocumentStatusToApp(document.status)
    })),
    notifications: notifications.data,
    upcomingDeliverables: upcomingDeliverables.data.map((deliverable) => ({
      ...deliverable,
      status: dbDeliverableStatusToApp(deliverable.status)
    })),
    unreadNotificationCount: notifications.data.filter((item) => !item.read_at).length
  };
}
