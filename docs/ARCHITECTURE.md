# Architecture Canonique LAKHub

## Principes

- Next.js App Router pour séparer clairement pages publiques, workspace privé et API internes
- Supabase comme backend principal pour Auth, Postgres, Storage et Realtime
- logique sensible uniquement côté serveur
- validation Zod partagée frontend/backend
- design system centralisé avec thèmes light/dark
- aucun fallback de démonstration côté données critiques

## Structure

- `src/app/(public)`: landing, login, reset password, invitation
- `src/app/(workspace)`: dashboard, projets, bibliothèque, documents, collaboration, versioning, IA, admin, paramètres
- `src/app/api`: autosave, export, avatar upload, IA
- `src/lib/data`: services métier par module
- `src/lib/permissions`: garde-fous applicatifs et matrice de rôles
- `src/lib/ai`: abstraction provider Claude / Perplexity et logique de quotas
- `supabase/migrations`: schéma, triggers, helpers SQL, RLS, buckets

## Choix de reconstruction

- Dépôt initial vide: abandon de tout héritage supposé non traçable
- Reconstruction depuis une base canonique modulaire
- Sécurité et permissions posées avant l’assemblage des écrans

