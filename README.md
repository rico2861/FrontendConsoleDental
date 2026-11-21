# DENTAL LIGHT — Console d'administration (FrontendConsoleDental)

Frontend **admin** de la plateforme (full responsive) : vue globale (abonnés, revenus, postes, sauvegardes, alertes), fiche clinique complète (hôtes, licences, paiements, sauvegardes, journal) et toutes les actions — créer une clinique, confirmer/vérifier un paiement, générer/télécharger une clé, révoquer, suspendre/réactiver, personnaliser (couleur, nom, logo, sièges). Statique, aucun build.

## Configuration
Éditez `config.js` → `window.DL_API` = URL du backend (vide = même origine). Si la console est sur un autre domaine : côté backend, `CORS_ORIGINS` = l'URL de cette console et `SAAS_CROSS_SITE=true`.

## Local
```bash
npx serve .    # ou: python3 -m http.server 8090
```

## Déploiement
Hébergement statique, ou servi par le backend (`STATIC_DIR`).
