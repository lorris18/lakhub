import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  BookCopy,
  FileText,
  FolderKanban,
  Gauge,
  Layers3,
  MessageSquare,
  PanelsTopLeft,
  Settings
} from "lucide-react";

export type WorkspaceArea = "pilotage" | "recherche" | "production" | "configuration";

export type NavigationItem = {
  area: WorkspaceArea;
  href: Route;
  hrefPrefix?: string;
  label: string;
  icon: LucideIcon;
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

export const workspaceNavigationSections: NavigationSection[] = [
  {
    label: "Pilotage",
    items: [
      { area: "pilotage", href: "/dashboard", label: "Tableau de bord", icon: Gauge },
      { area: "pilotage", href: "/work", label: "Vue transversale", icon: PanelsTopLeft }
    ]
  },
  {
    label: "Recherche",
    items: [
      { area: "recherche", href: "/projects", hrefPrefix: "/projects/", label: "Projets", icon: FolderKanban },
      { area: "recherche", href: "/library", hrefPrefix: "/library/", label: "Bibliothèque", icon: BookCopy }
    ]
  },
  {
    label: "Production",
    items: [
      { area: "production", href: "/documents", hrefPrefix: "/documents/", label: "Rédaction", icon: FileText },
      { area: "production", href: "/collaboration", hrefPrefix: "/collaboration/", label: "Collaboration", icon: MessageSquare },
      { area: "production", href: "/versioning", hrefPrefix: "/versioning/", label: "Versions", icon: Layers3 }
    ]
  },
  {
    label: "Configuration",
    items: [
      { area: "configuration", href: "/settings", hrefPrefix: "/settings/", label: "Paramètres", icon: Settings }
    ]
  }
];

export function getWorkspaceContext(pathname: string) {
  const fallback = {
    area: "pilotage" as const,
    areaLabel: "Pilotage",
    title: "Workspace LAKHub",
    description: "Cockpit personnel de travail, d’organisation et de production."
  };

  for (const section of workspaceNavigationSections) {
    for (const item of section.items) {
      if (
        pathname === item.href ||
        (item.hrefPrefix && pathname.startsWith(item.hrefPrefix)) ||
        pathname.startsWith(`${item.href}/`)
      ) {
        return {
          area: item.area,
          areaLabel: section.label,
          title: item.label,
          description:
            item.area === "recherche"
              ? "Sources, projets et matériaux de travail."
              : item.area === "production"
                ? "Rédaction, versions et échanges éditoriaux."
                : item.area === "configuration"
                  ? "Compte, sécurité et préférences du workspace."
                  : "Pilotage global, suivi et arbitrage du workspace."
        };
      }
    }
  }

  return fallback;
}
