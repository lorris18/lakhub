import { env } from "@/lib/env";

export const PRIVATE_APP_ORIGIN = "https://l-asim.com";
export const PUBLIC_SITE_ORIGIN = "https://lkirusha.com";

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "");
}

function parseOrigin(origin?: string | null) {
  if (!origin) {
    return null;
  }

  try {
    return normalizeOrigin(new URL(origin).toString());
  } catch {
    return null;
  }
}

export function getHubOrigin(fallbackOrigin = "https://l-asim.com") {
  const configuredHubOrigin = parseOrigin(env.NEXT_PUBLIC_APP_URL);
  if (
    configuredHubOrigin === PRIVATE_APP_ORIGIN ||
    configuredHubOrigin === "http://localhost:3000" ||
    configuredHubOrigin === "http://127.0.0.1:3000"
  ) {
    return configuredHubOrigin;
  }

  return normalizeOrigin(fallbackOrigin);
}

export function getPublicSiteOrigin(fallbackOrigin = "https://lkirusha.com") {
  const configuredPublicOrigin = parseOrigin(env.NEXT_PUBLIC_PUBLIC_SITE_URL);
  if (
    configuredPublicOrigin === PUBLIC_SITE_ORIGIN ||
    configuredPublicOrigin === "http://localhost:3000" ||
    configuredPublicOrigin === "http://127.0.0.1:3000"
  ) {
    return configuredPublicOrigin;
  }

  return normalizeOrigin(fallbackOrigin);
}
