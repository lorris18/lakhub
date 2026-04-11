import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { requireCurrentUser } from "@/lib/auth/session";
import { aiFeatureEnabled } from "@/lib/features";

export default async function AiPage() {
  await requireCurrentUser();
  if (!aiFeatureEnabled) {
    return (
      <div className="space-y-8">
        <SectionHeading
          eyebrow="IA"
          title="Module temporairement hors périmètre"
          description="La version de production actuelle de LAKHub est finalisée hors IA afin de prioriser la stabilité du produit, la sécurité et la chaîne de déploiement standard."
        />

        <Surface className="space-y-4">
          <h3 className="font-display text-2xl text-brand-primary">Bientôt disponible</h3>
          <p className="text-sm leading-7 text-text-secondary">
            Les assistants de rédaction et de recherche seront réintroduits dans une itération dédiée,
            sans bloquer l’usage quotidien des projets, documents, bibliothèques, validations et espaces
            d’administration.
          </p>
        </Surface>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="IA"
        title="IA maintenue hors chemin critique"
        description="Même lorsqu’elle est activée techniquement, l’IA ne pilote pas encore les parcours essentiels du produit."
      />

      <Surface className="space-y-4">
        <h3 className="font-display text-2xl text-brand-primary">Activation sous contrôle</h3>
        <p className="text-sm leading-7 text-text-secondary">
          Cette zone reste volontairement séparée des flux critiques pour préserver la stabilité,
          la lisibilité et la confiance produit sur le cœur du workspace.
        </p>
      </Surface>
    </div>
  );
}
