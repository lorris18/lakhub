import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StateScreen } from "@/components/ui/state-screen";

export default function WorkspaceNotFound() {
  return (
    <StateScreen
      eyebrow="Workspace"
      title="Contenu introuvable"
      description="L’élément demandé n’est plus disponible, n’existe pas ou n’est plus accessible avec votre session actuelle."
      variant="warning"
      action={
        <Link href="/dashboard">
          <Button variant="primary">Retour au dashboard</Button>
        </Link>
      }
      secondaryAction={
        <Link href="/projects">
          <Button variant="secondary">Voir les projets</Button>
        </Link>
      }
    />
  );
}
