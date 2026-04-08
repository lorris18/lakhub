import { NextResponse } from "next/server";

import { autosaveDocument } from "@/lib/data/documents";
import { documentAutosaveSchema } from "@/lib/validation/shared";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const payload = documentAutosaveSchema.parse(await request.json());

    await autosaveDocument(documentId, payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Autosave impossible."
      },
      { status: 400 }
    );
  }
}

