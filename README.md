# LAKHub

LAKHub est reconstruit ici comme une application web académique canonique avec Next.js App Router, TypeScript strict, Tailwind CSS et Supabase.

## Architecture

- `src/app`: routes publiques, privées et API internes
- `src/components`: composants UI et modules métier
- `src/lib`: clients Supabase, sécurité, validation, services métier et intégrations IA
- `supabase/migrations`: schéma relationnel, helpers SQL, triggers et RLS
- `docs`: architecture, matrice des permissions et design system

## Démarrage

1. Copier `.env.example` vers `.env.local`
2. Renseigner les variables Supabase et IA
3. Installer les dépendances avec `npm install`
4. Lancer `npm run dev`

## Vérifications

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run readiness`
- `npm run verify:supabase`
- `npm run bootstrap:admin -- user@institution.edu admin`

## Réalité produit

`npm run readiness` donne un verdict honnête sur la configuration réelle du produit:

- présence des variables critiques
- disponibilité potentielle de Supabase
- présence d’au moins un admin plateforme
- accès admin Auth/Storage quand la service role est fournie
- présence des clés IA Claude et Perplexity

Sans `.env.local` réel, l’application reste structurellement prête mais n’est pas encore validée comme produit live.

## Mise en service propre

La seule cible de production retenue est maintenant une base Supabase vierge.

- runbook de bascule: `docs/SUPABASE_CLEAN_CUTOVER.md`
- migration active pour base propre: `supabase/migrations/202604080001_lakhub_canonical_schema.sql`
- migrations legacy archivées: `supabase/legacy-migrations/`
- vérification post-migration: `npm run verify:supabase`
