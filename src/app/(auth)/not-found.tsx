import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StateScreen } from "@/components/ui/state-screen";

export default function AuthNotFound() {
  return (
    <StateScreen
      eyebrow="Accès privé"
      title="Lien indisponible"
      description="Le lien demandé n’est plus valide ou n’est plus disponible. Revenez à la connexion ou demandez un nouveau lien sécurisé."
      variant="warning"
      action={
        <Link href="/login">
          <Button variant="primary">Aller à la connexion</Button>
        </Link>
      }
      secondaryAction={
        <Link href="/reset-password">
          <Button variant="secondary">Réinitialiser un accès</Button>
        </Link>
      }
    />
  );
}
