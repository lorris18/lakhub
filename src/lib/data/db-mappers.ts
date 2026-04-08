export function appProjectStatusToDb(status: string) {
  switch (status) {
    case "planning":
      return "planning";
    case "active":
      return "active";
    case "review":
      return "review";
    case "completed":
      return "completed";
    case "archived":
      return "archived";
    default:
      return "planning";
  }
}

export function dbProjectStatusToApp(status?: string | null) {
  switch (status) {
    case "active":
      return "active";
    case "review":
      return "review";
    case "completed":
      return "completed";
    case "archived":
      return "archived";
    default:
      return "planning";
  }
}

export function appProjectRoleToDb(role: string) {
  return role.toLowerCase();
}

export function dbProjectRoleToApp(role?: string | null) {
  return role ? role.toLowerCase() : null;
}

export function appCommentStatusToDb(status: string) {
  return status === "resolved" ? "resolved" : "open";
}

export function dbCommentStatusToApp(status?: string | null) {
  return status === "resolved" ? "resolved" : "open";
}

export function appSuggestionStatusToDb(status: string) {
  switch (status) {
    case "accepted":
      return "accepted";
    case "rejected":
      return "rejected";
    default:
      return "open";
  }
}

export function dbSuggestionStatusToApp(status?: string | null) {
  switch (status) {
    case "accepted":
      return "accepted";
    case "rejected":
      return "rejected";
    default:
      return "open";
  }
}

export function dbSubmissionStatusToApp(status?: string | null) {
  switch (status) {
    case "changes_requested":
      return "changes_requested";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "submitted";
  }
}

export function dbDocumentStatusToApp(status?: string | null) {
  switch (status) {
    case "in_review":
      return "in_review";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "draft";
  }
}

export function dbDeliverableStatusToApp(status?: string | null) {
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "done":
      return "done";
    case "blocked":
      return "blocked";
    default:
      return "planned";
  }
}
