import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  BookCopy,
  FolderKanban,
  Gauge,
  Settings,
  ShieldCheck,
  Sparkles,
  SquarePen,
  UsersRound
} from "lucide-react";

export type NavigationItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  feature?: "ai";
};

export const workspaceNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: Gauge },
  { href: "/projects", label: "Projets", icon: FolderKanban },
  { href: "/library", label: "Bibliothèque", icon: BookCopy },
  { href: "/documents", label: "Atelier d’écriture", icon: SquarePen },
  { href: "/versioning", label: "Versioning", icon: Sparkles },
  { href: "/collaboration", label: "Collaboration", icon: UsersRound },
  { href: "/settings", label: "Paramètres", icon: Settings },
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true }
];
