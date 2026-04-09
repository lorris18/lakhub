import Link from "next/link";

import { addDeliverableAction, createInvitationAction, deleteProjectAction, updateProjectAction } from "@/app/(workspace)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getProjectDetail } from "@/lib/data/projects";
import { formatDate } from "@/lib/utils/format";

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ invite?: string }>;
}) {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const { projectId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const detail = await getProjectDetail(projectId);
  const members = detail.members.map((member) => {
    const user = Array.isArray(member.users) ? member.users[0] ?? null : member.users ?? null;
    return { ...member, user };
  });

  return (
    <div className="space-y-8">
      {resolvedSearchParams.invite ? (
        <Surface className="border border-border-subtle bg-surface-elevated">
          <p className="text-sm text-text-secondary">
            {resolvedSearchParams.invite === "invite-sent"
              ? "L’invitation email a été envoyée. Le collaborateur pourra définir lui-même son mot de passe depuis le lien reçu."
              : resolvedSearchParams.invite === "signin-link-sent"
                ? "Un lien de connexion a été envoyé au collaborateur. Une fois connecté, il pourra accepter l’invitation en un clic."
                : resolvedSearchParams.invite === "manual-rate-limit"
                  ? "L’invitation a été créée, mais Supabase a bloqué l’envoi email à cause du rate limit actuel. Utilisez le lien d’onboarding affiché ci-dessous."
                  : "L’invitation a été créée, mais l’envoi email automatique n’a pas pu être confirmé. Utilisez le lien d’onboarding affiché ci-dessous."}
          </p>
        </Surface>
      ) : null}

      <SectionHeading
        eyebrow="Projet"
        title={detail.project.title}
        description="Gouvernance du projet, livrables, membres, invitations et documents associés."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface className="space-y-4">
          <h3 className="font-display text-2xl text-brand-primary">Fiche projet</h3>
          <form action={updateProjectAction} className="space-y-4">
            <input name="projectId" type="hidden" value={projectId} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="title">
                Titre
              </label>
              <Input defaultValue={detail.project.title} id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="description">
                Description
              </label>
              <Textarea defaultValue={detail.project.description ?? ""} id="description" name="description" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="problemStatement">
                Problématique
              </label>
              <Textarea
                defaultValue={detail.project.problem_statement ?? ""}
                id="problemStatement"
                name="problemStatement"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="objectives">
                Objectifs
              </label>
              <Textarea defaultValue={detail.project.objectives ?? ""} id="objectives" name="objectives" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary" htmlFor="status">
                  Statut
                </label>
                <Select defaultValue={detail.project.status} id="status" name="status">
                  <option value="planning">Planning</option>
                  <option value="active">Actif</option>
                  <option value="review">En revue</option>
                  <option value="completed">Terminé</option>
                  <option value="archived">Archivé</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary" htmlFor="dueDate">
                  Échéance
                </label>
                <Input defaultValue={detail.project.due_date ?? ""} id="dueDate" name="dueDate" type="date" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="accent">
                Enregistrer
              </Button>
            </div>
          </form>
          <form action={deleteProjectAction}>
            <input name="projectId" type="hidden" value={projectId} />
            <Button type="submit" variant="ghost">
              Supprimer ce projet
            </Button>
          </form>
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Livrables</h3>
            <div className="space-y-3">
              {detail.deliverables.map((deliverable) => (
                <div key={deliverable.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <p className="font-medium text-brand-primary">{deliverable.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{deliverable.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                    {deliverable.due_date ? formatDate(deliverable.due_date) : "Sans échéance"} • {deliverable.status}
                  </p>
                </div>
              ))}
            </div>
            <form action={addDeliverableAction} className="space-y-3 border-t border-border-subtle pt-4">
              <input name="projectId" type="hidden" value={projectId} />
              <Input name="title" placeholder="Titre du livrable" required />
              <Textarea name="description" placeholder="Description" />
              <Input name="dueDate" type="date" />
              <Button type="submit" variant="secondary">
                Ajouter un livrable
              </Button>
            </form>
          </Surface>

          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Membres et invitations</h3>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.user_id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <p className="font-medium text-brand-primary">{member.user?.full_name ?? member.user?.email}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {member.role} • {member.user?.institution ?? "Institution non renseignée"}
                  </p>
                </div>
              ))}
            </div>
            <form action={createInvitationAction} className="space-y-3 border-t border-border-subtle pt-4">
              <input name="projectId" type="hidden" value={projectId} />
              <Input name="email" placeholder="Email du collaborateur" required type="email" />
              <Select defaultValue="collaborator" name="role">
                <option value="admin">Admin projet</option>
                <option value="collaborator">Collaborateur</option>
                <option value="reviewer">Reviewer</option>
                <option value="reader">Reader</option>
              </Select>
              <Button type="submit" variant="secondary">
                Inviter
              </Button>
            </form>
            {detail.invitations.length ? (
              <div className="space-y-3 border-t border-border-subtle pt-4">
                <p className="text-sm font-medium text-text-secondary">Invitations en attente et historiques</p>
                {detail.invitations.map((invitation) => (
                  <div key={invitation.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-brand-primary">{invitation.email}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {invitation.role} • {invitation.status}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                          Expire le {formatDate(invitation.expires_at)}
                        </p>
                      </div>
                      <Link className="text-sm font-medium text-brand-accent" href={`/invitation/${invitation.token}`}>
                        Ouvrir le lien d’onboarding
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Surface>

          <Surface className="space-y-4">
            <h3 className="font-display text-2xl text-brand-primary">Documents liés</h3>
            <div className="space-y-3">
              {detail.documents.map((document) => (
                <div key={document.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <p className="font-medium text-brand-primary">{document.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {document.kind} • {document.status}
                  </p>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
