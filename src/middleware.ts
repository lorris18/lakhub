import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { hasPublicSupabaseEnv } from "@/lib/env";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  if (!hasPublicSupabaseEnv) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const requiresPasswordChange = user?.user_metadata?.["must_change_password"] === true;
  const pathname = request.nextUrl.pathname;
  const passwordPolicyPath = "/api/settings/password-policy";
  const allowedPasswordChangePaths = new Set(["/settings", passwordPolicyPath, "/auth/callback"]);

  if (requiresPasswordChange && !allowedPasswordChangePaths.has(pathname)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { message: "Changement du mot de passe requis avant de poursuivre." },
        { status: 403 }
      );
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/settings";
    redirectUrl.searchParams.set("force-password-change", "1");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
