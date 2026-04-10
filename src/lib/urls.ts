import { env } from "@/lib/env";

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
  if (configuredHubOrigin) {
    return configuredHubOrigin;
  }

  return normalizeOrigin(fallbackOrigin);
}

export function getPublicSiteOrigin(fallbackOrigin = "https://lkirusha.com") {
  const configuredPublicOrigin = parseOrigin(env.NEXT_PUBLIC_PUBLIC_SITE_URL);
  if (configuredPublicOrigin) {
    return configuredPublicOrigin;
  }

  return normalizeOrigin(fallbackOrigin);
}
