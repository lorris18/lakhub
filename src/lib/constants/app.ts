import type { Metadata } from "next";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
};

export const hubBrand = {
  name: "LAKHub",
  description: "Espace privé de travail, de rédaction et de pilotage."
};

function withBrandTitle(title: string) {
  return title === hubBrand.name ? hubBrand.name : `${title} | ${hubBrand.name}`;
}

export function createHubMetadata({ title, description, path }: MetadataInput): Metadata {
  return {
    title: withBrandTitle(title),
    description,
    alternates: {
      canonical: path
    },
    robots: {
      index: false,
      follow: false
    }
  };
}
