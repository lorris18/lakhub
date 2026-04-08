# Matrice des Permissions

## Rôles de plateforme

- `user`: accès à son propre workspace
- `admin`: accès au module admin et aux vues agrégées produit
- `superadmin`: réservé aux opérations de gouvernance et d’audit sensibles

## Rôles de projet

- `owner`: contrôle total du projet, des membres, des documents et des soumissions
- `admin`: gestion opérationnelle du projet sans transfert de propriété
- `collaborator`: édition des documents du projet, commentaires, suggestions, gestion limitée des livrables
- `reviewer`: lecture, commentaires, suggestions, validation de soumission
- `reader`: lecture uniquement

## Principes RLS

- un utilisateur ne voit ses données personnelles que via ownership ou membership explicite
- les admins plateforme n’écrasent jamais les permissions projet sans policy dédiée
- aucun `USING (true)` ou `WITH CHECK (true)` sur les tables critiques
- les fonctions SQL de permission fixent explicitement `search_path = public`

