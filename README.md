# LAKHub

Application privée servie sur `l-asim.com`.

Le site public associé est `https://lkirusha.com`.

## Périmètre

- connexion et récupération de mot de passe
- invitations
- dashboard privé
- documents, projets, bibliothèque, paramètres
- API internes et intégration Supabase

## Démarrage

```bash
npm run dev
```

## Vérification

```bash
npm run typecheck
npm run build
```

## Variables utiles

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Exploitation

- [Environnement](./docs/operations/ENVIRONMENT.md)
- [Déploiement](./docs/operations/DEPLOYMENT.md)
- [Recovery / incident](./docs/operations/RECOVERY.md)
- [Gestion admin](./docs/operations/ADMIN_RUNBOOK.md)
