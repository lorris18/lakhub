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

function swapSubdomain(origin: string, currentPrefix: string, nextPrefix: string) {
  try {
    const url = new URL(origin);
    if (!url.hostname.startsWith(`${currentPrefix}.`)) {
      return null;
    }

    url.hostname = `${nextPrefix}.${url.hostname.slice(currentPrefix.length + 1)}`;
    return normalizeOrigin(url.toString());
  } catch {
    return null;
  }
}

export function getHubOrigin(fallbackOrigin = "http://localhost:3000") {
  const configuredHubOrigin = parseOrigin(env.NEXT_PUBLIC_APP_URL);
  if (configuredHubOrigin) {
    return configuredHubOrigin;
  }

  const configuredPublicOrigin = parseOrigin(env.NEXT_PUBLIC_PUBLIC_SITE_URL);
  if (configuredPublicOrigin) {
    return swapSubdomain(configuredPublicOrigin, "www", "hub") ?? configuredPublicOrigin;
  }

  return normalizeOrigin(fallbackOrigin);
}

export function getPublicSiteOrigin(fallbackOrigin = "https://www.l-asim.com") {
  const configuredPublicOrigin = parseOrigin(env.NEXT_PUBLIC_PUBLIC_SITE_URL);
  if (configuredPublicOrigin) {
    return configuredPublicOrigin;
  }

  const configuredHubOrigin = parseOrigin(env.NEXT_PUBLIC_APP_URL);
  if (configuredHubOrigin) {
    return swapSubdomain(configuredHubOrigin, "hub", "www") ?? fallbackOrigin;
  }

  return normalizeOrigin(fallbackOrigin);
}
