# Keskon mange — Améliorations post-MVP (V2)

Recueil d'idées issu du brainstorm Slack du 23/03/2026.

**Contributeurs** : Hugo Borsoni, Corentin Gerest, Salomé Fournel.

---

## Sommaire

1. [Bouton "J'y vais" — Présence du midi](#1-bouton-jy-vais--présence-du-midi)
2. [Tirage au sort amélioré](#2-tirage-au-sort-amélioré)
3. [Fix des filtres](#3-fix-des-filtres)
4. [Autocomplete d'adresse via Google Places API](#4-autocomplete-dadresse-via-google-places-api)
5. [Catégories de restaurants](#5-catégories-de-restaurants)
6. [Photos dans les avis](#6-photos-dans-les-avis)

---

## 1. Bouton "J'y vais" — Présence du midi

**Auteur** : Hugo Borsoni

### Objectif

Permettre aux utilisateurs de signaler qu'ils comptent manger dans un restaurant donné ce midi, et voir qui d'autre y va.

### Comportement attendu

- Un bouton "J'y vais" est visible sur la fiche restaurant et/ou la popup carte.
- En cliquant, l'utilisateur indique qu'il ira manger là aujourd'hui.
- Les avatars / photos de profil des utilisateurs qui ont cliqué "J'y vais" sont affichés sur la fiche et le marqueur carte.
- La présence est liée à la journée en cours : elle se réinitialise chaque jour automatiquement.
- L'utilisateur peut annuler sa présence (toggle).

### Données

- `userId`
- `restaurantId`
- `date` (jour courant)
- `createdAt`

### Règles métier

- Un utilisateur ne peut signaler sa présence que pour **un seul restaurant par jour** (ou plusieurs — arbitrage à décider).
- La présence expire en fin de journée.
- Les avatars affichés sont ceux des utilisateurs connectés qui ont signalé leur présence pour le jour courant.

### Critères d'acceptation

- Je peux cliquer sur "J'y vais" depuis une fiche restaurant.
- Je vois les têtes des gens qui ont aussi cliqué "J'y vais" pour ce midi.
- Ma présence disparaît le lendemain.
- Je peux annuler ma présence.

---

## 2. Tirage au sort amélioré

**Auteur** : Hugo Borsoni

### Objectif

Rendre l'animation du tirage au sort plus fancy et engageante, au-delà de l'animation basique du MVP.

### Pistes d'amélioration

- **Animation de type roulette / slot machine** : défilement de noms de restaurants avant de ralentir et s'arrêter sur le résultat.
- **Effets visuels** : confettis, particules, shake, ou glow au moment du résultat.
- **Son** (optionnel) : effet sonore de roulement + ding au résultat.
- **Suspense** : un court délai dramatique avant la révélation.
- **Affichage enrichi du résultat** : carte du restaurant avec photo, note, type, et un message fun ("Le destin a parlé !").

### Contraintes

- L'animation doit rester performante sur mobile.
- Le résultat doit apparaître en moins de 3-4 secondes.
- L'animation ne doit pas bloquer l'interaction (bouton skip / accélérer possible).

### Critères d'acceptation

- Le tirage comporte une animation visuelle engageante.
- L'animation est fluide sur mobile.
- Le résultat final est clairement mis en avant.
- Je peux relancer facilement.

---

## 3. Fix des filtres

**Auteur** : Hugo Borsoni

### Objectif

Corriger les bugs existants sur le système de filtres.

### Actions requises

- Auditer les filtres actuels (sur place, à emporter, prix) pour identifier les bugs.
- Vérifier la cohérence entre carte, liste, et tirage aléatoire quand les filtres sont actifs.
- Vérifier que le reset des filtres fonctionne correctement.
- Vérifier la synchronisation des filtres via URL (nuqs).

### Critères d'acceptation

- Les filtres fonctionnent correctement sur la carte, la liste, et le tirage.
- Le reset remet tous les filtres à leur état initial.
- Les filtres sont correctement reflétés dans l'URL.

---

## 4. Autocomplete d'adresse via Google Places API

**Auteur** : Corentin Gerest

### Objectif

Améliorer le flux d'ajout d'un restaurant en permettant la recherche par nom de lieu avec autocomplete, au lieu de devoir connaître l'adresse exacte.

### Solution recommandée

Utiliser **Google Places API — Autocomplete (New)** pour afficher des suggestions au fur et à mesure de la saisie.

#### Alternatives évaluées

| API | Usage | Adapté ? |
|-----|-------|----------|
| **Places API – Autocomplete (New)** | Suggestions pendant la saisie | **Oui — recommandé** |
| Places API – Text Search (New) | Recherche full-text ("pizza à Paris") | Possible, moins UX |
| Geocoding API | Adresse → coordonnées | Pas d'autocomplete |

### Comportement attendu

- Dans le formulaire d'ajout de restaurant, le champ adresse propose des suggestions au fur et à mesure de la frappe.
- L'utilisateur sélectionne un résultat dans la liste déroulante.
- Le nom, l'adresse formatée, et les coordonnées GPS sont automatiquement remplis.
- L'utilisateur peut toujours saisir une adresse manuellement (fallback).

### Gestion des coûts

- Google Places API est **gratuit jusqu'à ~10 000 requêtes/mois** (avec carte bancaire enregistrée pour dépassement).
- **Mise en cache côté serveur** des résultats de recherche pour réduire le nombre d'appels.
- **Rate limiting par utilisateur** pour empêcher les abus et rester dans le quota gratuit.
- Possibilité de **debounce côté client** (300-500ms) pour limiter les appels pendant la frappe.

### Données récupérées depuis l'API

- `displayName` → pré-remplir le nom du restaurant
- `formattedAddress` → pré-remplir l'adresse
- `location.latitude` / `location.longitude` → coordonnées GPS
- `types` → suggestion de catégorie (optionnel)

### Règles métier

- Le debounce doit être d'au moins 300ms pour éviter les appels inutiles.
- Les résultats doivent être filtrés par zone géographique pertinente (ex. Paris / Île-de-France).
- L'utilisateur peut toujours éditer manuellement les champs après sélection.

### Critères d'acceptation

- Je tape un nom de restaurant et je vois des suggestions apparaître.
- Je sélectionne une suggestion et les champs nom, adresse, coordonnées se remplissent.
- Les suggestions sont pertinentes géographiquement.
- Le système reste dans le quota gratuit en usage normal.

---

## 5. Catégories de restaurants

**Auteurs** : Salomé Fournel, Hugo Borsoni

### Objectif

Ajouter un système de catégories de cuisine (ex. "Vietnamien", "Italien", "Burger") avec un tri alphabétique, et permettre aux admins de gérer les catégories disponibles.

### Comportement attendu

#### Catégories

- Chaque restaurant est associé à une catégorie de cuisine (remplace ou enrichit le champ `restaurantType` actuel).
- Les catégories sont prédéfinies et gérées par les admins.
- La liste des restaurants peut être triée par ordre alphabétique.
- Les catégories servent de filtre supplémentaire (carte + liste + tirage).

#### Gestion admin des catégories

- Un utilisateur admin peut ajouter, modifier, ou supprimer des catégories.
- La suppression d'une catégorie utilisée par des restaurants nécessite un traitement (reassignation ou catégorie "Autre").

### Données

**Table `categories`** :
- `id`
- `name` (unique)
- `slug`
- `createdAt`
- `updatedAt`

**Modification de `restaurants`** :
- `categoryId` (FK vers `categories`) remplace ou complète `restaurantType`

### Règles métier

- Les catégories sont affichées par ordre alphabétique.
- Un restaurant doit avoir exactement une catégorie.
- Seuls les admins peuvent créer/modifier/supprimer des catégories.
- Tous les utilisateurs peuvent voir et filtrer par catégorie.

### Critères d'acceptation

- Je vois la catégorie d'un restaurant sur sa fiche et sur la carte.
- Je peux filtrer les restaurants par catégorie.
- La liste peut être triée par ordre alphabétique.
- En tant qu'admin, je peux ajouter une nouvelle catégorie.
- En tant qu'admin, je peux modifier ou supprimer une catégorie existante.

---

## 6. Photos dans les avis

**Auteur** : Salomé Fournel

### Objectif

Permettre aux utilisateurs d'ajouter des photos dans leurs avis/commentaires sur les restaurants.

### État actuel

Le modèle de données prévoit déjà un champ `photoUrls[]` sur les avis (cf. specs MVP §6.2), mais la fonctionnalité d'upload n'est pas encore implémentée.

### Comportement attendu

- Depuis le formulaire d'avis, l'utilisateur peut joindre une ou plusieurs photos.
- Les photos sont affichées dans l'avis et dans la galerie de la fiche restaurant.
- Les photos sont optimisées (compression, redimensionnement) avant stockage.
- Formats acceptés : JPEG, PNG, WebP.
- Taille max par photo : à définir (ex. 5 Mo avant compression).

### Stockage

- Les photos doivent être stockées sur un service de stockage objet (ex. Vercel Blob, S3, Cloudinary).
- Les URLs sont sauvegardées dans le champ `photoUrls[]` de l'avis.

### Règles métier

- Nombre max de photos par avis : à définir (ex. 3-5).
- Seul l'auteur de l'avis peut ajouter/supprimer ses photos.
- Les photos doivent être supprimées du stockage si l'avis est supprimé.

### Critères d'acceptation

- Je peux ajouter des photos quand je laisse un avis.
- Les photos apparaissent dans l'avis et la galerie du restaurant.
- Les photos sont correctement compressées et affichées.
- Je peux supprimer mes photos.

---

## Priorisation suggérée

| Priorité | Feature | Effort estimé | Impact |
|----------|---------|---------------|--------|
| 1 | Fix des filtres | Faible | Élevé — bug bloquant |
| 2 | Photos dans les avis | Moyen | Élevé — prévu dans le MVP |
| 3 | Catégories de restaurants | Moyen | Élevé — UX structurante |
| 4 | Bouton "J'y vais" | Moyen | Élevé — feature sociale clé |
| 5 | Autocomplete Google Places | Moyen | Moyen — UX d'ajout |
| 6 | Tirage au sort amélioré | Faible-Moyen | Moyen — polish / fun |

---

## Notes techniques

- **Google Places API** : nécessite une clé API Google Cloud avec facturation activée. Rester sous 10k requêtes/mois pour le tier gratuit.
- **Upload photos** : choisir un provider de stockage (Vercel Blob, Cloudinary, S3). Implémenter la compression côté client ou serveur.
- **Rôle admin** : nécessite l'ajout d'un champ `role` sur le modèle utilisateur (ou une table de rôles).
- **Présence "J'y vais"** : nécessite une nouvelle table avec nettoyage automatique (cron ou TTL).
