# Keskon mange — Plan d'implémentation V2

---

## Résumé de l'architecture actuelle

- **Database** : Drizzle ORM + PostgreSQL — tables `users`, `accounts`, `sessions`, `verificationTokens`, `restaurants`, `reviews`, `favorites`
- **Auth** : Auth.js v5 avec Google provider, sessions JWT, pas de système de rôles
- **Server Actions** : `src/server/actions/` pour les mutations (restaurants, reviews, favorites)
- **Server Queries** : `src/server/queries/` pour les lectures (restaurants, reviews, favorites)
- **Filtres** : état URL via nuqs avec `dineIn`, `takeAway`, `priceRange`
- **Tirage** : chaîne de composants client (`DrawContainer` → `DrawAnimation` → `DrawResult`) avec animation setTimeout
- **Carte** : React Leaflet avec `divIcon` affichant les notes
- **Avis** : CRUD avec note 1-5, commentaire, colonne `photoUrls` déjà en schema mais upload non implémenté
- **Types de restaurant** : hardcodés dans `src/lib/constants.ts` en string enum

---

## Epic 1 — Fix des filtres (Priorité 1 — Effort faible, Impact élevé)

### Analyse des problèmes potentiels

1. **Parsing de `priceRange`** : la fonction `parsePriceRange` dans `page.tsx` split par virgule, ce qui peut être incompatible avec la sérialisation nuqs (clés répétées `?priceRange=EUR_1&priceRange=EUR_2`).
2. **Sémantique des booléens** : les filtres sont `true | undefined` — vérifier que le comportement est correct.
3. **Cohérence list/map/draw** : le `DrawContainer` reçoit les restaurants filtrés du serveur — la chaîne semble correcte mais à valider.
4. **Reset** : le reset dans `FilterBar` met tout à `null` — à vérifier end-to-end.

### Tâches

| # | Tâche | Fichiers |
|---|-------|----------|
| 1.1 | Auditer et reproduire les bugs de filtres | Manuel |
| 1.2 | Corriger la robustesse de `parsePriceRange` | `src/app/(main)/page.tsx` |
| 1.3 | Extraire et tester `parsePriceRange` | `src/lib/utils.ts` (ou nouveau), tests colocalisés |
| 1.4 | Vérifier la sérialisation nuqs vs parsing serveur | `src/hooks/use-filters.ts` |
| 1.5 | Ajouter test E2E pour les filtres | `e2e/filters.spec.ts` |

### Fichiers à modifier
- `src/app/(main)/page.tsx`
- `src/hooks/use-filters.ts`
- `src/server/queries/restaurants.ts`

### Tests
- Tests unitaires pour `parsePriceRange` (undefined, string vide, valeur unique, multiples, invalides)
- Test E2E : appliquer chaque filtre, vérifier URL, vérifier contenu liste, reset

---

## Epic 2 — Photos dans les avis (Priorité 2 — Effort moyen, Impact élevé)

### État actuel
La table `reviews` a déjà une colonne `photoUrls text("photo_urls").array()`. Le formulaire et les actions ne gèrent pas l'upload.

### Décision technique : Vercel Blob
Le projet est déjà sur Vercel → utiliser **Vercel Blob** (1 Go stockage, 5 Go bande passante sur Hobby).

### Tâches

| # | Tâche | Fichiers |
|---|-------|----------|
| 2.1 | Installer et configurer `@vercel/blob` | `package.json`, `.env.local` |
| 2.2 | Créer la route API d'upload | `src/app/api/upload/route.ts` (nouveau) |
| 2.3 | Créer le schéma de validation upload | `src/lib/validations/upload.ts` (nouveau) |
| 2.4 | Mettre à jour le formulaire d'avis pour l'upload | `src/components/reviews/review-form.tsx` |
| 2.5 | Mettre à jour les server actions review | `src/server/actions/reviews.ts` |
| 2.6 | Mettre à jour les validations review | `src/lib/validations/review.ts` |
| 2.7 | Afficher les photos dans la liste des avis | `src/components/reviews/review-list.tsx` |
| 2.8 | Afficher la galerie photo sur la fiche restaurant | `src/app/(main)/restaurants/[id]/page.tsx` |
| 2.9 | Permettre la suppression de photos | Intégré dans `updateReview` |
| 2.10 | Ajouter les messages i18n | `messages/fr.json` |
| 2.11 | Configurer les domaines Blob dans `next.config.ts` | `next.config.ts` |

### Fichiers à créer
- `src/app/api/upload/route.ts`
- `src/lib/validations/upload.ts`

### Fichiers à modifier
- `src/components/reviews/review-form.tsx`
- `src/components/reviews/review-list.tsx`
- `src/server/actions/reviews.ts`
- `src/lib/validations/review.ts`
- `src/app/(main)/restaurants/[id]/page.tsx`
- `messages/fr.json`
- `next.config.ts`
- `package.json`

### Contraintes
- Token `BLOB_READ_WRITE_TOKEN` à configurer dans Vercel
- Pas de changement de schema (colonne déjà existante)
- Max 5 Mo/photo, formats JPEG/PNG/WebP, max 5 photos/avis

### Tests
- Tests unitaires : validation upload, actions review mises à jour (mock blob)
- Test E2E : upload photo dans un avis, vérifier l'affichage

---

## Epic 3 — Catégories de restaurants (Priorité 3 — Effort moyen, Impact élevé)

### Décision technique
Remplacer le champ texte `restaurantType` hardcodé par une table `categories` managée par des admins. Nécessite l'ajout d'un système de rôles.

### Tâches

| # | Tâche | Fichiers |
|---|-------|----------|
| 3.1 | Ajouter `roleEnum` et colonne `role` à `users` | `src/server/db/schema.ts` |
| 3.2 | Créer la table `categories` + FK `categoryId` sur `restaurants` | `src/server/db/schema.ts` |
| 3.3 | Créer les données de seed des catégories | Script ou action serveur |
| 3.4 | Créer le guard d'authentification admin | `src/server/auth-utils.ts` (nouveau) |
| 3.5 | Créer les queries catégories | `src/server/queries/categories.ts` (nouveau) |
| 3.6 | Créer les actions catégories (admin only) | `src/server/actions/categories.ts` (nouveau) |
| 3.7 | Créer les validations catégories | `src/lib/validations/category.ts` (nouveau) |
| 3.8 | Créer la page admin de gestion des catégories | `src/app/(main)/admin/categories/page.tsx` (nouveau) |
| 3.9 | Mettre à jour le formulaire restaurant | `src/components/restaurants/restaurant-form.tsx` |
| 3.10 | Mettre à jour les actions/validations restaurant | `src/server/actions/restaurants.ts`, `src/lib/validations/restaurant.ts` |
| 3.11 | Afficher le nom de catégorie dans les cartes/popup/fiches | Components carte + restaurant |
| 3.12 | Ajouter le filtre par catégorie | `use-filters.ts`, `filter-bar.tsx`, `restaurants.ts` query, `page.tsx` |
| 3.13 | Vérifier le tri alphabétique | `src/server/queries/restaurants.ts` |
| 3.14 | Ajouter lien admin dans le header | `src/components/layout/header.tsx` |
| 3.15 | Ajouter les messages i18n | `messages/fr.json` |

### Changements de schema

```
Nouvel enum : user_role ("user", "admin")
Nouvelle colonne : users.role (user_role, default "user")
Nouvelle table : categories (id, name, slug, createdAt, updatedAt)
Nouvelle colonne : restaurants.categoryId (FK → categories.id)
Déprécié : restaurants.restaurantType (garder temporairement)
```

### Fichiers à créer
- `src/server/auth-utils.ts`
- `src/server/queries/categories.ts`
- `src/server/actions/categories.ts`
- `src/lib/validations/category.ts`
- `src/app/(main)/admin/categories/page.tsx`
- `src/components/categories/category-form.tsx`
- `src/components/categories/category-list.tsx`

### Fichiers à modifier
- `src/server/db/schema.ts`
- `src/components/restaurants/restaurant-form.tsx`
- `src/lib/validations/restaurant.ts`
- `src/server/actions/restaurants.ts`
- `src/server/queries/restaurants.ts`
- `src/hooks/use-filters.ts`
- `src/components/filters/filter-bar.tsx`
- `src/app/(main)/page.tsx`
- `src/components/restaurants/restaurant-card.tsx`
- `src/components/map/map-popup.tsx`
- `src/components/layout/header.tsx`
- `messages/fr.json`

### Migration de données
- Les restaurants existants doivent être migrés de `restaurantType` texte vers `categoryId` FK
- Créer les catégories initiales à partir des `RESTAURANT_TYPES` existants

### Tests
- Tests unitaires : validation catégories, actions catégories, queries, guard admin
- Tests unitaires : validation/actions restaurant mises à jour
- Tests E2E : CRUD admin catégories, filtre par catégorie

---

## Epic 4 — Bouton "J'y vais" (Priorité 4 — Effort moyen, Impact élevé)

### Décision technique
- Un utilisateur peut signaler sa présence pour **un seul restaurant par jour**
- Clé primaire `(userId, date)` pour l'unicité
- Pas de cron nécessaire : les requêtes filtrent par date du jour, les anciennes entrées sont ignorées

### Tâches

| # | Tâche | Fichiers |
|---|-------|----------|
| 4.1 | Créer la table `lunch_attendance` | `src/server/db/schema.ts` |
| 4.2 | Créer les queries d'attendance | `src/server/queries/attendance.ts` (nouveau) |
| 4.3 | Créer l'action `toggleAttendance` | `src/server/actions/attendance.ts` (nouveau) |
| 4.4 | Créer la validation attendance | `src/lib/validations/attendance.ts` (nouveau) |
| 4.5 | Créer le composant bouton "J'y vais" | `src/components/attendance/attendance-button.tsx` (nouveau) |
| 4.6 | Créer le composant avatars | `src/components/attendance/attendance-avatars.tsx` (nouveau) |
| 4.7 | Intégrer dans la fiche restaurant | `src/app/(main)/restaurants/[id]/page.tsx` |
| 4.8 | Intégrer dans la popup carte | `src/components/map/map-popup.tsx` |
| 4.9 | Intégrer dans la carte restaurant | `src/components/restaurants/restaurant-card.tsx` |
| 4.10 | Fetcher les données dans la page principale | `src/app/(main)/page.tsx` |
| 4.11 | Ajouter les messages i18n | `messages/fr.json` |

### Changements de schema

```
Nouvelle table : lunch_attendance (userId, restaurantId, date, createdAt)
Clé primaire : (userId, date)
Foreign keys : userId → users.id, restaurantId → restaurants.id
```

### Fichiers à créer
- `src/server/queries/attendance.ts`
- `src/server/actions/attendance.ts`
- `src/lib/validations/attendance.ts`
- `src/components/attendance/attendance-button.tsx`
- `src/components/attendance/attendance-avatars.tsx`

### Fichiers à modifier
- `src/server/db/schema.ts`
- `src/app/(main)/page.tsx`
- `src/app/(main)/restaurants/[id]/page.tsx`
- `src/components/map/map-popup.tsx`
- `src/components/restaurants/restaurant-card.tsx`
- `messages/fr.json`

### Tests
- Tests unitaires : toggle attendance (logique switch, contrainte un-par-jour)
- Tests unitaires : queries attendance
- Test E2E : cliquer "J'y vais", vérifier avatar, cliquer à nouveau pour annuler

---

## Epic 5 — Autocomplete Google Places (Priorité 5 — Effort moyen, Impact moyen)

### Décision technique
- **Google Places API (New) — Autocomplete** via route API serveur (protège la clé)
- Debounce client 300ms
- Biais géographique vers Paris / Île-de-France

### Tâches

| # | Tâche | Fichiers |
|---|-------|----------|
| 5.1 | Configurer le projet Google Cloud + clé API | Externe + `.env.local` |
| 5.2 | Créer la route API proxy Places | `src/app/api/places/autocomplete/route.ts` (nouveau) |
| 5.3 | Créer le hook d'autocomplete | `src/hooks/use-places-autocomplete.ts` (nouveau) |
| 5.4 | Créer le composant input autocomplete | `src/components/restaurants/address-autocomplete.tsx` (nouveau) |
| 5.5 | Mettre à jour le formulaire restaurant | `src/components/restaurants/restaurant-form.tsx` |
| 5.6 | Mettre à jour les server actions restaurant | `src/server/actions/restaurants.ts` |
| 5.7 | Mettre à jour les validations restaurant | `src/lib/validations/restaurant.ts` |
| 5.8 | Ajouter les messages i18n | `messages/fr.json` |

### Fichiers à créer
- `src/app/api/places/autocomplete/route.ts`
- `src/hooks/use-places-autocomplete.ts`
- `src/components/restaurants/address-autocomplete.tsx`

### Fichiers à modifier
- `src/components/restaurants/restaurant-form.tsx`
- `src/server/actions/restaurants.ts`
- `src/lib/validations/restaurant.ts`
- `messages/fr.json`

### Contraintes
- Clé API Google Cloud requise (setup externe)
- Les modifications du formulaire interagissent avec l'Epic 3 (catégories) — coordonner si en parallèle
- Fallback sur geocoding Nominatim si pas de sélection Places

### Tests
- Tests unitaires : route API Places (mock réponses Google)
- Tests unitaires : debounce du hook
- Tests unitaires : validation restaurant mise à jour
- Test E2E : taper un nom, sélectionner suggestion, vérifier les champs remplis

---

## Epic 6 — Tirage au sort amélioré (Priorité 6 — Effort faible-moyen, Impact moyen)

### État actuel
Animation dans `draw-animation.tsx` : boucle `setTimeout` de 20 itérations avec noms qui défilent. Résultat dans `draw-result.tsx` : nom, type, prix, note.

### Décision technique
- Animation slot machine / roulette avec défilement vertical décélérant
- Confettis au résultat via `canvas-confetti`
- Bouton "skip" pour aller directement au résultat
- Durée totale < 3-4 secondes
- Pas de son (v1)

### Tâches

| # | Tâche | Fichiers |
|---|-------|----------|
| 6.1 | Installer `canvas-confetti` | `package.json` |
| 6.2 | Refondre l'animation de tirage (slot machine) | `src/components/random-draw/draw-animation.tsx` |
| 6.3 | Enrichir le composant résultat (confettis, message fun) | `src/components/random-draw/draw-result.tsx` |
| 6.4 | Ajouter le support "skip" dans le container | `src/components/random-draw/draw-container.tsx` |
| 6.5 | Ajouter les animations CSS | `src/app/globals.css` |
| 6.6 | Ajouter les messages i18n | `messages/fr.json` |
| 6.7 | Tester la performance sur mobile | Manuel |

### Fichiers à modifier
- `src/components/random-draw/draw-animation.tsx` (refonte majeure)
- `src/components/random-draw/draw-result.tsx`
- `src/components/random-draw/draw-container.tsx`
- `src/app/globals.css`
- `messages/fr.json`
- `package.json`

### Contraintes
- Purement frontend, pas de changement DB
- Animation fluide sur mobile (60fps)
- `will-change` hints pour les éléments animés

### Tests
- Test visuel (manuel) — l'animation est difficile à tester en unitaire
- Test E2E : déclencher le tirage, vérifier que le résultat apparaît en < 4s
- Test de performance sur navigateur mobile

---

## Ordre d'implémentation recommandé

```
Epic 1 (Fix Filtres)     ──────►
Epic 2 (Photos)          ──────────────►
Epic 6 (Tirage fancy)    ──────────────►     (parallélisable avec 2 et 4)
Epic 3 (Catégories)      ──────────────────────────►
Epic 4 (J'y vais)        ──────────────────────────►     (parallélisable avec 3)
Epic 5 (Google Places)                                ──────────────►  (après 3)
```

- **Epics 2, 4, 6** sont totalement indépendantes et parallélisables.
- **Epic 3 avant Epic 5** : les deux touchent le formulaire restaurant.
- **Epic 1 en premier** : scope réduit, débloque la confiance dans le code existant.

---

## Résumé des migrations de schema

| Migration | Tables/Colonnes | Epic |
|-----------|----------------|------|
| 1 | `user_role` enum, `users.role`, `categories` table, `restaurants.categoryId` | Epic 3 |
| 2 | `lunch_attendance` table | Epic 4 |
| *(aucune)* | `reviews.photoUrls` existe déjà | Epic 2 |

---

## Dépendances externes

| Dépendance | Epic | Action requise |
|------------|------|----------------|
| `@vercel/blob` + token Vercel | Epic 2 | Install npm + config Vercel dashboard |
| Clé API Google Places | Epic 5 | Créer projet Google Cloud + activer billing |
| `canvas-confetti` | Epic 6 | Install npm |

---

## Fichiers critiques (touchés par plusieurs epics)

| Fichier | Epics |
|---------|-------|
| `src/server/db/schema.ts` | 3, 4 |
| `src/server/queries/restaurants.ts` | 1, 3 |
| `src/components/restaurants/restaurant-form.tsx` | 3, 5 |
| `src/app/(main)/page.tsx` | 1, 3, 4 |
| `messages/fr.json` | 2, 3, 4, 5, 6 |
