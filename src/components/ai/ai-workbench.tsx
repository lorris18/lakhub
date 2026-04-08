"use client";

import { useState, useTransition } from "react";
import { Bot, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";

type AiResult = {
  text: string;
  provider: "claude" | "perplexity";
  sources?: Array<{
    title: string;
    url: string;
    snippet?: string | null;
  }>;
};

type Props = {
  dailyLimit: number;
};

const quickTemplates = [
  {
    label: "Plan d'article",
    title: "Generer un plan academique",
    mode: "writing" as const,
    prompt:
      "Propose un plan academique detaille avec sections, sous-sections et logique argumentative pour ce sujet."
  },
  {
    label: "Problematique",
    title: "Formuler une problematique",
    mode: "writing" as const,
    prompt:
      "A partir du contexte fourni, formule une problematique de recherche claire, rigoureuse et defendable."
  },
  {
    label: "Recherche sourcee",
    title: "Recherche documentaire recente",
    mode: "research" as const,
    prompt:
      "Recherche les sources recentes et pertinentes sur ce theme, puis produis une synthese courte avec citations web."
  },
  {
    label: "Critique de texte",
    title: "Analyser les faiblesses d'un texte",
    mode: "critique" as const,
    prompt:
      "Identifie les faiblesses argumentatives, methodologiques et stylistiques de ce texte, puis propose des ameliorations."
  }
];

export function AiWorkbench({ dailyLimit }: Props) {
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("auto");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/ai/run", {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              mode: String(formData.get("mode") ?? "auto"),
              prompt: String(formData.get("prompt") ?? ""),
              context: String(formData.get("context") ?? ""),
              title: String(formData.get("title") ?? "")
            })
          });

          const payload = (await response.json()) as AiResult & { error?: string };
          if (!response.ok) {
            setError(payload.error ?? "Execution IA impossible.");
            return;
          }

          setResult(payload);
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Execution IA impossible.");
        }
      })();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Surface className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Moteur IA</p>
          <h3 className="font-display text-2xl text-brand-primary">Claude + Perplexity</h3>
          <p className="text-sm text-text-secondary">
            Mode Auto: recherche et actualité vers Perplexity, écriture et critique vers Claude.
          </p>
          <p className="text-sm text-text-secondary">Quota quotidien actuel: {dailyLimit} requêtes.</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Actions rapides</p>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((template) => (
              <Button
                key={template.label}
                onClick={() => {
                  setMode(template.mode);
                  setTitle(template.title);
                  setPrompt(template.prompt);
                }}
                size="sm"
                variant="ghost"
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary" htmlFor="title">
              Sujet
            </label>
            <input
              className="h-11 w-full rounded-xl border border-border-subtle bg-surface-panel px-3 text-sm"
              id="title"
              name="title"
              placeholder="Ex. Analyse critique d’un cadre théorique"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary" htmlFor="mode">
              Mode
            </label>
            <Select id="mode" name="mode" onChange={(event) => setMode(event.target.value)} value={mode}>
              <option value="auto">Auto</option>
              <option value="writing">Rédaction</option>
              <option value="research">Recherche sourcée</option>
              <option value="critique">Critique</option>
              <option value="compare">Comparaison de versions</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary" htmlFor="prompt">
              Demande
            </label>
            <Textarea
              id="prompt"
              name="prompt"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Décrivez la tâche à accomplir."
              required
              value={prompt}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary" htmlFor="context">
              Contexte optionnel
            </label>
            <Textarea
              value={context}
              id="context"
              name="context"
              onChange={(event) => setContext(event.target.value)}
              placeholder="Collez une section, des notes, des éléments de projet ou un extrait de document."
            />
          </div>

          {error ? <p className="text-sm text-text-secondary">{error}</p> : null}

          <Button className="w-full" disabled={isPending} type="submit" variant="accent">
            {isPending ? "Analyse en cours..." : "Exécuter"}
          </Button>
        </form>
      </Surface>

      <Surface className="min-h-[420px]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-accent-soft p-3 text-brand-accent">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Résultat</p>
            <h3 className="font-display text-2xl text-brand-primary">Sortie assistée</h3>
          </div>
        </div>

        {result ? (
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Provider sélectionné: <span className="text-brand-primary">{result.provider}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-text-primary">{result.text}</p>
            </div>
            {result.sources?.length ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Sources</p>
                {result.sources.map((source) => (
                  <a
                    key={source.url}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-panel p-4 transition hover:border-brand-accent"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div>
                      <p className="font-medium text-brand-primary">{source.title}</p>
                      <p className="mt-1 text-sm text-text-secondary">{source.url}</p>
                      {source.snippet ? <p className="mt-2 text-sm text-text-muted">{source.snippet}</p> : null}
                    </div>
                    <ExternalLink className="mt-1 h-4 w-4 text-text-muted" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface-elevated p-8 text-sm text-text-secondary">
            Lancez une requête pour obtenir une réponse, des suggestions de rédaction ou des sources
            récentes selon le mode choisi.
          </div>
        )}
      </Surface>
    </div>
  );
}
