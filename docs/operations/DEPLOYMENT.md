# Déploiement

## Déploiement standard

1. Vérifier que `main` contient l’état voulu.
2. Lancer `npm run build`.
3. Lancer `npm run readiness`.
4. Pousser sur `main`.
5. Attendre la fin du déploiement Netlify production.
6. Vérifier en live:
   - `https://l-asim.com/login`
   - `https://l-asim.com/reset-password`
   - `/admin` avec un compte admin

## Déploiement forcé Netlify

Utiliser ce mode si la prod n’a pas pris le dernier état malgré un push:

```bash
npx --yes netlify-cli deploy --build --prod --message "Redeploy production"
```

## Vérifications minimales après déploiement

1. La page de login affiche bien l’identité privée LAKHub.
2. Le lien vers le site public pointe vers `https://lkirusha.com`.
3. La readiness admin ne montre aucun blocage.
4. Le reset password répond avec `{"ok":true}`.
5. Si l’email a été touché, rejouer une invitation admin UI complète.
