import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");
  const { url, anonKey } = getSupabasePublicConfig();
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
  const safeDestination = nextPath?.startsWith("/") ? nextPath : "/dashboard";

  const response = NextResponse.redirect(new URL(safeDestination, appUrl));
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
