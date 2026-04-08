import { format, formatDistanceToNowStrict } from "date-fns";

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "Non défini";
  }

  return format(new Date(value), "dd MMM yyyy");
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "Non défini";
  }

  return format(new Date(value), "dd MMM yyyy, HH:mm");
}

export function fromNow(value?: string | Date | null) {
  if (!value) {
    return "Aucune activité";
  }

  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

export function initials(name?: string | null) {
  if (!name) {
    return "LA";
  }

  return name
    .split(" ")
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

