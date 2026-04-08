"use client";

import { useActionState, useEffect } from "react";

import { deleteOwnAccountAction, type DeleteAccountActionState } from "@/app/(workspace)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: DeleteAccountActionState = {
  status: "idle"
};

type Props = {
  email: string;
};

export function AccountDeletionForm({ email }: Props) {
  const [state, action, isPending] = useActionState(deleteOwnAccountAction, initialState);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-primary">Supprimer définitivement le compte</p>
        <p className="text-sm text-text-secondary">
          Cette action supprime le compte Auth, le profil, les préférences, les objets privés du
          storage associés à ce compte et les données liées via les cascades de la base.
        </p>
      </div>
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary" htmlFor="confirmEmail">
            Confirmez votre email
          </label>
          <Input
            autoComplete="email"
            id="confirmEmail"
            name="confirmEmail"
            placeholder={email}
            required
            type="email"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary" htmlFor="confirmationText">
            Tapez SUPPRIMER
          </label>
          <Input
            autoCapitalize="characters"
            id="confirmationText"
            name="confirmationText"
            placeholder="SUPPRIMER"
            required
          />
        </div>
      </div>
      {state.message ? (
        <p className="text-sm text-text-secondary" role="status">
          {state.message}
        </p>
      ) : null}
      <Button disabled={isPending} type="submit" variant="ghost">
        {isPending ? "Suppression en cours..." : "Supprimer définitivement mon compte"}
      </Button>
    </form>
  );
}
