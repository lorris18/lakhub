import { NextResponse } from "next/server";

import { executeAiRun } from "@/lib/data/ai";
import { aiFeatureEnabled } from "@/lib/features";
import { aiRunSchema } from "@/lib/validation/shared";

export async function POST(request: Request) {
  if (!aiFeatureEnabled) {
    return NextResponse.json(
      {
        error: "Le module IA est temporairement désactivé dans cette version de production."
      },
      { status: 503 }
    );
  }

  try {
    const payload = aiRunSchema.parse(await request.json());
    const result = await executeAiRun(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Exécution IA impossible."
      },
      { status: 400 }
    );
  }
}
