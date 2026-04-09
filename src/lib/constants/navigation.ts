import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { BookCopy, FolderKanban, Gauge } from "lucide-react";

export type NavigationItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
};

export const workspaceNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Accueil", icon: Gauge },
  { href: "/work", label: "Travaux", icon: FolderKanban },
  { href: "/library", label: "Bibliothèque", icon: BookCopy }
];
