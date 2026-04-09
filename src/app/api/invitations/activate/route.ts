import { NextResponse } from "next/server";

import { completeInvitationAccountSetup } from "@/lib/data/projects";
import { invitationActivationSchema } from "@/lib/validation/shared";

export async function POST(request: Request) {
  try {
    const payload = invitationActivationSchema.parse(await request.json());
    const result = await completeInvitationAccountSetup(payload);

    if (result.reason === "existing-account") {
      return NextResponse.json(
        {
          error:
            "Un compte existe déjà pour cette adresse. Connectez-vous pour accepter l’invitation.",
          loginPath: result.loginPath
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      redirectTo: result.redirectTo
    });
  } catch (caughtError) {
    return NextResponse.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Activation de l’invitation impossible."
      },
      { status: 400 }
    );
  }
}
