# Supabase Clean Cutover

Ce document formalise la mise en service de LAKHub sur une nouvelle base Supabase vierge.

## A. Ce qu'il faut creer

Creer un nouveau projet Supabase dedie a la production propre de LAKHub avec:

- nom recommande: `lakhub-prod-clean`
- organisation Supabase: `dpnhefayfyvmrwpbhexn` (`LORRIS ASIMA`)
- region: choisir la region disponible la plus proche de Kinshasa
- mot de passe Postgres fort et conserve hors repo

Le nouveau projet doit rester vierge. Aucun import de donnees de demo ne doit etre applique.

## B. Cles et identifiants a recuperer

Depuis le nouveau projet Supabase, recuperer:

- `project ref`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`

Cotes outils d'exploitation, conserver aussi:

- `SUPABASE_ACCESS_TOKEN`
- `NETLIFY_AUTH_TOKEN`
- l'email du premier admin a promouvoir

## C. Commandes a lancer

### 1. Creation du projet

```bash
SUPABASE_ACCESS_TOKEN=... \
npx supabase@latest projects create lakhub-prod-clean \
  --org-id dpnhefayfyvmrwpbhexn \
  --region <region> \
  --db-password '<db-password>'
```

### 2. Variables locales

Creer `.env.local` avec:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_DB_PASSWORD=<db-password>
AI_USAGE_DAILY_LIMIT=25
```

Les cles suivantes seront ajoutees ensuite, quand disponibles:

```dotenv
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
```

### 3. Liaison du projet local

```bash
SUPABASE_ACCESS_TOKEN=... \
npx supabase@latest link --project-ref <project-ref> -p '<db-password>'
```

### 4. Migration canonique uniquement

Le dossier actif `supabase/migrations` ne contient plus que la migration canonique. Les migrations de compatibilite historiques ont ete archivees dans `supabase/legacy-migrations`.

```bash
SUPABASE_ACCESS_TOKEN=... \
npx supabase@latest db push -p '<db-password>'
```

### 5. Verification de la base propre

```bash
npm run readiness
npm run verify:supabase
```

### 6. Bootstrap du premier admin

```bash
npm run bootstrap:admin -- admin@institution.edu admin
```

### 7. Variables Netlify

```bash
NETLIFY_AUTH_TOKEN=... npx netlify-cli env:set NEXT_PUBLIC_APP_URL https://<production-url>
NETLIFY_AUTH_TOKEN=... npx netlify-cli env:set NEXT_PUBLIC_SUPABASE_URL https://<project-ref>.supabase.co
NETLIFY_AUTH_TOKEN=... npx netlify-cli env:set NEXT_PUBLIC_SUPABASE_ANON_KEY <publishable-key>
NETLIFY_AUTH_TOKEN=... npx netlify-cli env:set SUPABASE_SERVICE_ROLE_KEY <service-role-key>
NETLIFY_AUTH_TOKEN=... npx netlify-cli env:set SUPABASE_DB_PASSWORD <db-password>
NETLIFY_AUTH_TOKEN=... npx netlify-cli env:set AI_USAGE_DAILY_LIMIT 25
```

Quand les cles IA seront disponibles:

```bash
NETLIFY_AUTH_TOKEN=... npx netlify-cli env:set ANTHROPIC_API_KEY <anthropic-key>
NETLIFY_AUTH_TOKEN=... npx netlify-cli env:set PERPLEXITY_API_KEY <perplexity-key>
```

### 8. Deploiement final

```bash
NETLIFY_AUTH_TOKEN=... npx netlify-cli deploy --build --prod
```

## D. Ordre exact de bascule

1. Creer le nouveau projet Supabase vierge.
2. Recuperer `project ref`, URL, publishable key, service role key et mot de passe DB.
3. Mettre a jour `.env.local`.
4. Lier le projet local avec `supabase link`.
5. Executer `supabase db push`.
6. Lancer `npm run verify:supabase`.
7. Promouvoir le premier admin avec `npm run bootstrap:admin`.
8. Brancher les variables Netlify sur la nouvelle base.
9. Ajouter Claude et Perplexity quand les cles sont disponibles.
10. Deployer sur Netlify.
11. Executer les validations live navigateur et API.
12. Livrer le lien final.

## E. Ce que je ferai ensuite

Quand le nouveau projet Supabase existera, j'executerai dans cet ordre:

1. liaison au nouveau projet
2. migration canonique
3. verification des triggers, helpers comportementaux, RLS et storage
4. bootstrap admin
5. branchement Netlify
6. ajout des cles IA
7. deploiement
8. tests live finaux

## Notes

- La nouvelle base propre devient l'unique cible de production.
- Les fichiers `supabase/legacy-migrations/*` sont archives pour reference et ne doivent pas etre appliques au nouveau projet vierge.
