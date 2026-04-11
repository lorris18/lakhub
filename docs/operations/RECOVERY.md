# Procédure d'incident

## Si les emails applicatifs repassent en warning

1. Ouvrir `/admin` et lire la carte `Emails applicatifs`.
2. Vérifier sur Netlify:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_SECURE`
   - `EMAIL_FROM_ADDRESS`
   - `EMAIL_FROM_NAME`
   - `EMAIL_REPLY_TO`
3. Vérifier que `RESEND_API_KEY` est absent.
4. Redéployer la production.
5. Rejouer:
   - un reset password
   - une invitation admin UI

## Si l’auth ou les redirections cassent

1. Vérifier `NEXT_PUBLIC_APP_URL=https://l-asim.com`.
2. Vérifier `NEXT_PUBLIC_PUBLIC_SITE_URL=https://lkirusha.com`.
3. Vérifier que `/login` et `/auth/callback` restent sur `l-asim.com`.
4. Tester la connexion avec un compte admin.

## Si une régression de prod doit être stoppée vite

1. Identifier le dernier tag stable.
2. Revenir au tag stable dans Git.
3. Redéployer la production depuis cet état.
4. Refaire les trois contrôles minimum:
   - login
   - reset password
   - admin readiness
