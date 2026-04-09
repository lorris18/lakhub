import { NextResponse } from "next/server";

import { acceptInvitation } from "@/lib/data/projects";
import { invitationAcceptSchema } from "@/lib/validation/shared";

export async function POST(request: Request) {
  try {
    const payload = invitationAcceptSchema.parse(await request.json());
    const result = await acceptInvitation(payload.token);

    return NextResponse.json({
      redirectTo: `/projects/${result.projectId}`
    });
  } catch (caughtError) {
    return NextResponse.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Acceptation de l’invitation impossible."
      },
      { status: 400 }
    );
  }
}
