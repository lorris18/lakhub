import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/data/helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier avatar requis." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const extension = file.name.split(".").pop() || "png";
    const path = `${user.id}/${randomUUID()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    const upload = await supabase.storage.from("avatars").upload(path, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: true
    });

    if (upload.error) {
      throw upload.error;
    }

    const profileUpdate = await supabase.from("users").update({ avatar_path: path }).eq("id", user.id);
    if (profileUpdate.error) {
      throw profileUpdate.error;
    }

    return NextResponse.json({ message: "Avatar mis à jour." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload avatar impossible."
      },
      { status: 400 }
    );
  }
}

