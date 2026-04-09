import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const authUpdate = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      must_change_password: false
    }
  });

  if (authUpdate.error) {
    return NextResponse.json({ message: authUpdate.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
