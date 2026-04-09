import {
  createCollectionAction,
  createLibraryItemAction,
  createTagAction,
  importLibraryFileAction,
  updateLibraryClassificationAction
} from "@/app/(workspace)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { hasPublicSupabaseEnv, hasServiceRoleEnv } from "@/lib/env";
import { listLibraryItems, listLibraryTaxonomy } from "@/lib/data/library";
import { listProjects } from "@/lib/data/projects";
import { formatDate } from "@/lib/utils/format";

export default async function LibraryPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const params = await searchParams;
  const [items, taxonomy, projects] = await Promise.all([
    listLibraryItems(params?.q),
    listLibraryTaxonomy(),
    listProjects()
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Bibliothèque"
        title="Corpus et références personnelles"
        description="Une liste claire d’abord. L’import, le classement avancé et la taxonomie restent disponibles mais moins envahissants."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-brand-primary">Sources</h3>
            <p className="text-sm text-text-secondary">{items.length} résultat(s)</p>
          </div>

          <form className="flex flex-col gap-3 sm:flex-row" method="get">
            <Input defaultValue={params?.q ?? ""} name="q" placeholder="Rechercher par titre, DOI ou résumé" />
            <Button type="submit" variant="secondary">
              Rechercher
            </Button>
          </form>

          <div className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-brand-primary">{item.title}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {item.authors?.length ? item.authors.join(", ") : "Auteur non renseigné"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-text-muted">
                      <p>{item.item_type}</p>
                      <p>{item.publication_year ?? "n.d."}</p>
                    </div>
                  </div>

                  {item.metadata?.source_kind === "uploaded_file" ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-brand-accent">
                      Fichier importé: {item.metadata?.uploaded_file_name}
                    </p>
                  ) : null}

                  {item.doi ? (
                    <p className="mt-3 text-sm text-text-secondary">
                      DOI: <span className="text-brand-primary">{item.doi}</span>
                    </p>
                  ) : null}

                  <p className="mt-3 text-sm text-text-secondary">{item.summary ?? "Sans résumé."}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.collections.map((collection) => (
                      <Badge key={`${item.id}-collection-${collection.id}`} variant="primary">
                        {collection.name}
                      </Badge>
                    ))}
                    {item.tags.map((tag) => (
                      <Badge key={`${item.id}-tag-${tag.id}`} variant="accent">
                        {tag.name}
                      </Badge>
                    ))}
                    {!item.collections.length && !item.tags.length ? (
                      <Badge variant="subtle">Non classé</Badge>
                    ) : null}
                  </div>

                  <details className="mt-4 rounded-2xl border border-border-subtle bg-surface-panel p-4">
                    <summary className="cursor-pointer text-sm font-medium text-brand-primary">
                      Classer cette source
                    </summary>
                    <form action={updateLibraryClassificationAction} className="mt-4 space-y-4">
                      <input name="itemId" type="hidden" value={item.id} />

                      {taxonomy.collections.length || taxonomy.tags.length ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                          <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-text-secondary">Collections</legend>
                            {taxonomy.collections.length ? (
                              taxonomy.collections.map((collection) => (
                                <label
                                  key={`${item.id}-${collection.id}`}
                                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-text-secondary"
                                >
                                  <input
                                    defaultChecked={item.collections.some((entry) => entry.id === collection.id)}
                                    name="collectionIds"
                                    type="checkbox"
                                    value={collection.id}
                                  />
                                  <span>{collection.name}</span>
                                </label>
                              ))
                            ) : (
                              <p className="text-sm text-text-secondary">Aucune collection créée.</p>
                            )}
                          </fieldset>

                          <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-text-secondary">Tags</legend>
                            {taxonomy.tags.length ? (
                              taxonomy.tags.map((tag) => (
                                <label
                                  key={`${item.id}-${tag.id}`}
                                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-text-secondary"
                                >
                                  <input
                                    defaultChecked={item.tags.some((entry) => entry.id === tag.id)}
                                    name="tagIds"
                                    type="checkbox"
                                    value={tag.id}
                                  />
                                  <span>{tag.name}</span>
                                </label>
                              ))
                            ) : (
                              <p className="text-sm text-text-secondary">Aucun tag créé.</p>
                            )}
                          </fieldset>
                        </div>
                      ) : (
                        <p className="text-sm text-text-secondary">
                          Créez d’abord des collections ou des tags pour classer cette source.
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                          Mise à jour {formatDate(item.updated_at)}
                        </p>
                        <Button type="submit" variant="secondary">
                          Mettre à jour le classement
                        </Button>
                      </div>
                    </form>
                  </details>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border-strong bg-surface-panel p-8 text-sm text-text-secondary">
                La bibliothèque est prête. Ajoutez une première source ou importez un document pour
                commencer votre corpus.
              </div>
            )}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Action principale</p>
              <h3 className="mt-2 font-display text-2xl text-brand-primary">Ajouter une source</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Une fiche légère pour entrer vite dans le corpus. Les options plus avancées restent repliées.
              </p>
            </div>

            <form action={createLibraryItemAction} className="space-y-4">
              <Input name="title" placeholder="Titre" required />
              <Input name="authors" placeholder="Auteurs séparés par des virgules" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="publicationYear" placeholder="Année" type="number" />
                <Select defaultValue="article" name="itemType">
                  <option value="article">Article</option>
                  <option value="book">Livre</option>
                  <option value="web">Source web</option>
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="note">Note</option>
                </Select>
              </div>
              <Input name="doi" placeholder="DOI" />
              <Input name="url" placeholder="URL" type="url" />
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary" htmlFor="libraryProjectId">
                  Projet lié
                </label>
                <Select defaultValue="" id="libraryProjectId" name="projectId">
                  <option value="">Aucun projet pour le moment</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </Select>
              </div>
              <Textarea name="summary" placeholder="Résumé synthétique" />
              <Button className="w-full" type="submit" variant="accent">
                Ajouter à la bibliothèque
              </Button>
            </form>
          </Surface>

          <Surface className="space-y-4">
            <details className="rounded-2xl border border-border-subtle bg-surface-elevated p-4" open={items.length === 0}>
              <summary className="cursor-pointer text-sm font-medium text-brand-primary">
                Importer un PDF, DOCX ou une note
              </summary>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-text-secondary">
                  Le fichier est téléversé dans le storage privé et rattaché à une fiche bibliothèque.
                </p>
                {hasServiceRoleEnv ? (
                  <form action={importLibraryFileAction} className="space-y-4">
                    <div className="rounded-2xl border border-border-subtle bg-surface-panel p-4">
                      <label className="block text-sm font-medium text-text-secondary" htmlFor="file">
                        Fichier source
                      </label>
                      <input
                        accept=".pdf,.doc,.docx,.txt,.md"
                        className="mt-3 block w-full rounded-xl border border-border-subtle bg-surface-base p-3 text-sm"
                        id="file"
                        name="file"
                        required
                        type="file"
                      />
                    </div>
                    <Input name="title" placeholder="Titre optionnel (sinon nom du fichier)" />
                    <Input name="authors" placeholder="Auteurs séparés par des virgules" />
                    <Input name="doi" placeholder="DOI optionnel" />
                    <Textarea name="summary" placeholder="Résumé ou note de lecture courte" />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary" htmlFor="importProjectId">
                        Projet lié
                      </label>
                      <Select defaultValue="" id="importProjectId" name="projectId">
                        <option value="">Aucun projet pour le moment</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.title}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button className="w-full" type="submit" variant="secondary">
                      Importer le fichier
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-border-subtle bg-surface-panel p-4 text-sm text-text-secondary">
                    L’import nécessite `SUPABASE_SERVICE_ROLE_KEY` pour le storage privé.
                  </div>
                )}
              </div>
            </details>
          </Surface>

          <Surface className="space-y-4">
            <details className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
              <summary className="cursor-pointer text-sm font-medium text-brand-primary">
                Organisation avancée
              </summary>
              <div className="mt-4 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl text-brand-primary">Collections</h3>
                    <Badge variant="primary">{taxonomy.collections.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {taxonomy.collections.length ? (
                      taxonomy.collections.map((collection) => (
                        <div
                          key={collection.id}
                          className="rounded-2xl border border-border-subtle bg-surface-panel p-4"
                        >
                          <p className="font-medium text-brand-primary">{collection.name}</p>
                          <p className="mt-1 text-sm text-text-secondary">
                            {collection.description ?? "Sans description."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-text-secondary">Aucune collection pour le moment.</p>
                    )}
                  </div>
                  <form action={createCollectionAction} className="space-y-3 border-t border-border-subtle pt-4">
                    <Input name="name" placeholder="Nom de la collection" required />
                    <Textarea name="description" placeholder="Description courte" />
                    <Button type="submit" variant="secondary">
                      Créer la collection
                    </Button>
                  </form>
                </div>

                <div className="space-y-4 border-t border-border-subtle pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl text-brand-primary">Tags</h3>
                    <Badge variant="accent">{taxonomy.tags.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {taxonomy.tags.length ? (
                      taxonomy.tags.map((tag) => (
                        <Badge key={tag.id} variant="accent">
                          {tag.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-text-secondary">Aucun tag pour le moment.</p>
                    )}
                  </div>
                  <form action={createTagAction} className="space-y-3 border-t border-border-subtle pt-4">
                    <Input name="name" placeholder="Nouveau tag" required />
                    <Button type="submit" variant="secondary">
                      Créer le tag
                    </Button>
                  </form>
                </div>
              </div>
            </details>
          </Surface>
        </div>
      </div>
    </div>
  );
}
