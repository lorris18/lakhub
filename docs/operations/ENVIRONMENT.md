# Environnement de production

## Domaine et identité

- Application privée: `https://l-asim.com`
- Site public: `https://lkirusha.com`
- Expéditeur officiel: `lorris@lkirusha.com`
- Nom expéditeur: `LAKHub`

## Variables nécessaires

### Application

- `NEXT_PUBLIC_APP_URL=https://l-asim.com`
- `NEXT_PUBLIC_PUBLIC_SITE_URL=https://lkirusha.com`

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Email applicatif

- `EMAIL_FROM_ADDRESS=lorris@lkirusha.com`
- `EMAIL_FROM_NAME=LAKHub`
- `EMAIL_REPLY_TO=lorris@lkirusha.com`
- `SMTP_HOST=smtppro.zoho.com`
- `SMTP_PORT=587`
- `SMTP_USER=lorris@lkirusha.com`
- `SMTP_PASSWORD`
- `SMTP_SECURE=false`

## Variables à laisser désactivées

- `RESEND_API_KEY`
  Cette variable doit rester absente si Zoho SMTP est le transport de production. Si elle est définie, l’application bascule en priorité sur Resend.

## Contrôle rapide

1. Ouvrir `/admin`.
2. Vérifier la carte `Emails applicatifs`.
3. Le statut attendu est `ready`.
4. Le détail attendu mentionne `Transport SMTP` et `lorris@lkirusha.com`.
