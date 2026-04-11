# Gestion admin et comptes

## Créer un accès plateforme

1. Se connecter avec un compte `admin` ou `superadmin`.
2. Ouvrir `/admin`.
3. Utiliser `Ajouter un utilisateur`.
4. Laisser le mot de passe provisoire vide pour générer un mot de passe temporaire automatiquement.
5. Vérifier le message de retour:
   - `email envoyé` si le transport est opérationnel
   - `email n’a pas pu être envoyé` si une remise manuelle est nécessaire

## Comportement attendu

- Le compte est créé avec `must_change_password=true`.
- La première connexion redirige vers `Paramètres` avec changement obligatoire du mot de passe.
- Après changement, l’utilisateur rejoint normalement le workspace.

## Gérer les rôles

1. Ouvrir la section `Gestion des rôles`.
2. Choisir `user`, `admin` ou `superadmin`.
3. Valider avec `Mettre à jour`.

## Supprimer un accès

1. Ouvrir `/admin`.
2. Trouver le compte concerné.
3. Utiliser `Supprimer cet accès`.
4. Vérifier que le compte disparaît de la liste.

## Règle d’exploitation

- Utiliser un compte QA dédié pour les tests d’invitation.
- Ne pas réinitialiser le compte principal d’administration pour un test.
- Après un test de bout en bout, supprimer les comptes QA si leur conservation n’est pas utile.
