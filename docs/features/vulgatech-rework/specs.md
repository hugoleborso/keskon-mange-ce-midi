# Keskon mange — Spécifications fonctionnelles

## 1. Vision produit

**Keskon mange** est une application collaborative et drôle qui aide un groupe à décider rapidement où déjeuner.

Le cœur du produit :

- référencer des restaurants,
- partager des avis et des photos,
- visualiser les options sur une carte,
- filtrer selon des contraintes simples,
- et lancer un **tirage aléatoire** pour trancher la question du midi.

L’application doit être :

- **rapide à comprendre**,
- **simple à utiliser**,
- **collaborative**,
- **fun mais utile**,
- **mobile-first**.

---

## 2. Objectif du MVP

Permettre à une équipe ou un groupe :

1. d’ajouter et maintenir une base commune de restaurants,
2. de noter les restaurants avec photos,
3. de consulter les restaurants sur une carte avec notes visibles,
4. de filtrer les restaurants selon des critères utiles,
5. de sauvegarder ses favoris,
6. de tirer un restaurant au hasard pour le déjeuner.

---

## 3. Utilisateurs cibles

### Utilisateurs principaux

- équipes au bureau,
- groupes d’amis,
- collectifs/coworkings.

### Besoins principaux

- trouver vite où manger,
- éviter les débats interminables,
- partager les bons plans,
- garder une mémoire collective des restos testés.

---

## 4. Principes produit

1. **La décision doit être rapide** : moins de 3 interactions pour consulter, filtrer ou lancer le tirage.
2. **La contribution doit être simple** : ajouter un resto ou un avis ne doit pas être pénible.
3. **La carte est centrale** : elle sert à explorer et à visualiser les notes.
4. **Le hasard est un mode de décision, pas un gadget** : le tirage doit être fiable et tenir compte des filtres.
5. **Le ton doit être léger** : sans nuire à la lisibilité.

---

## 5. Périmètre MVP

### Inclus dans le MVP

- authentification simple,
- création / lecture / modification des restaurants,
- avis avec note, commentaire et photos,
- carte avec affichage des restaurants,
- note visible sur la carte,
- favoris,
- filtres :
  - sur place,
  - à emporter,
  - prix,
- fonctionnalité de tirage aléatoire,
- zoom automatique sur le restaurant sélectionné.

### Exclu du MVP

- réservation,
- livraison,
- horaires temps réel,
- modération avancée,
- recommandation personnalisée,
- vote collectif,
- import automatique depuis Google Places,
- gestion complexe des rôles.

---

## 6. Objets métier

## 6.1 Restaurant

### Champs obligatoires

- `id`
- `name`
- `address`
- `latitude`
- `longitude`

### Champs fonctionnels

- `restaurantType` : type principal de cuisine ou catégorie
- `labels[]` : tags fonctionnels ou alimentaires
- `averagePrice` : prix moyen estimé
- `priceRange` : optionnel, ex. €, €€, €€€, €€€€
- `dineIn` : oui/non
- `takeAway` : oui/non
- `status` : actif / fermé temporairement / fermé définitivement
- `createdBy`
- `createdAt`
- `updatedAt`
- `photoCoverUrl` : photo principale facultative
- `averageRating` : calculé
- `reviewsCount` : calculé

### Exemples de types

- italien
- japonais
- burger
- libanais
- indien
- sandwicherie
- végétarien
- brunch
- bistrot

### Exemples de labels

- halal
- veggie-friendly
- vegan-friendly
- sans gluten
- rapide
- terrasse
- groupe
- bon rapport qualité-prix
- copieux

---

## 6.2 Avis

### Champs obligatoires

- `id`
- `restaurantId`
- `authorId`
- `rating` (1 à 5)

### Champs fonctionnels

- `comment`
- `photoUrls[]`
- `createdAt`
- `updatedAt`

### Règle MVP recommandée

- **1 avis par utilisateur par restaurant**, modifiable.

Cela simplifie :

- la compréhension côté produit,
- le calcul de la note,
- l’édition d’avis,
- l’UX.

---

## 6.3 Favori

### Champs

- `userId`
- `restaurantId`
- `createdAt`

### Règle

- les favoris sont **strictement personnels**.

---

## 7. Fonctionnalités détaillées

# 7.1 Consulter les restaurants

L’utilisateur doit pouvoir consulter les restaurants :

- sous forme de **carte**,
- et idéalement aussi sous forme de **liste** synchronisée avec la carte.

### Données visibles au minimum

- nom,
- note moyenne,
- type,
- prix moyen,
- disponibilité sur place / à emporter,
- photo principale si disponible.

### Comportement attendu

- au chargement, l’utilisateur voit la carte et les restaurants disponibles,
- un clic sur un marqueur ouvre un aperçu,
- depuis l’aperçu, il peut ouvrir la fiche détaillée.

---

# 7.2 Ajouter un restaurant

## Objectif

Permettre à un utilisateur d’enrichir la base en quelques secondes.

## Formulaire minimal

- nom
- adresse
- type de restaurant
- labels
- prix moyen
- sur place (oui/non)
- à emporter (oui/non)

## Comportement attendu

- l’adresse permet de positionner le restaurant sur la carte,
- avant validation, le système vérifie l’existence possible d’un doublon,
- après création, le restaurant apparaît immédiatement sur la carte et dans la liste.

## Règles métier

- nom obligatoire,
- adresse obligatoire,
- latitude/longitude obligatoires côté donnée finale,
- si nom + adresse ressemblent fortement à une fiche existante, afficher une alerte de doublon.

## Critères d’acceptation

- je peux créer un restaurant avec nom et adresse,
- je vois le restaurant après création,
- la carte sait l’afficher,
- les champs sur place / à emporter / prix sont sauvegardés.

# 7.2 Ajouter un restaurant

## Objectif

Permettre à un utilisateur d’enrichir la base en quelques secondes.

## Formulaire minimal

- nom
- adresse
- type de restaurant
- labels
- prix moyen
- sur place (oui/non)
- à emporter (oui/non)

## Comportement attendu

- l’adresse permet de positionner le restaurant sur la carte,
- avant validation, le système vérifie l’existence possible d’un doublon,
- après création, le restaurant apparaît immédiatement sur la carte et dans la liste.

## Règles métier

- nom obligatoire,
- adresse obligatoire,
- latitude/longitude obligatoires côté donnée finale,
- si nom + adresse ressemblent fortement à une fiche existante, afficher une alerte de doublon.

## Critères d’acceptation

- je peux créer un restaurant avec nom et adresse,
- je vois le restaurant après création,
- la carte sait l’afficher,
- les champs sur place / à emporter / prix sont sauvegardés.

---

# 7.3 Modifier un restaurant

## Objectif

Permettre à la base d’être maintenue collectivement.

## Modifications autorisées dans le MVP

- nom
- adresse
- type
- labels
- prix moyen
- sur place / à emporter
- statut

## Règles métier

- toute modification met à jour `updatedAt`,
- un restaurant fermé définitivement ne doit pas être proposé au tirage aléatoire,
- un restaurant fermé temporairement ne doit pas être proposé par défaut.

## Critères d’acceptation

- je peux éditer une fiche restaurant,
- les modifications sont visibles ensuite,
- le tirage aléatoire exclut les restaurants indisponibles.

---

# 7.4 Voir la fiche d’un restaurant

## Objectif

Centraliser toutes les infos utiles dans une vue unique.

## Contenu de la fiche

- nom,
- adresse,
- note moyenne,
- nombre d’avis,
- type,
- labels,
- prix moyen,
- sur place / à emporter,
- galerie photo,
- liste des avis,
- bouton favori,
- bouton ajouter/modifier un avis,
- bouton modifier la fiche.

## Critères d’acceptation

- je peux ouvrir une fiche depuis la carte ou la liste,
- je vois les infos principales sans scroller longtemps,
- je peux accéder aux avis et aux photos.

---

# 7.5 Laisser un avis

## Objectif

Partager un retour utile et visuel.

## Données de l’avis

- note obligatoire (1 à 5),
- commentaire facultatif,
- photos facultatives.

## Comportement attendu

- depuis la fiche restaurant, l’utilisateur clique sur “Ajouter un avis”,
- il renseigne sa note,
- il peut ajouter un commentaire,
- il peut joindre une ou plusieurs photos,
- il valide,
- la note moyenne du restaurant est recalculée.

## Règles métier

- un utilisateur ne peut avoir qu’un seul avis actif par restaurant dans le MVP,
- s’il a déjà posté un avis, l’action devient “Modifier mon avis”,
- la note moyenne du restaurant est recalculée après création, modification ou suppression d’un avis.

## Critères d’acceptation

- je peux laisser une note,
- je peux ajouter un commentaire,
- je peux joindre des photos,
- la note moyenne est mise à jour automatiquement.

---

# 7.6 Voir les notes sur la carte

## Objectif

Permettre de repérer rapidement les meilleures options depuis la carte.

## Comportement attendu

Chaque restaurant doit apparaître sur la carte avec un marqueur contenant au minimum un indicateur de note.

## Recommandation UX MVP

- afficher la **note moyenne directement sur le pin** si lisible,
- ouvrir une mini-popup au clic avec :
  - nom,
  - note,
  - type,
  - prix,
  - photo éventuelle.

## Règles métier

- si un restaurant n’a aucun avis, afficher “Nouveau” ou “Pas encore noté”,
- les notes doivent être arrondies à 1 décimale,
- la lisibilité sur mobile est prioritaire.

## Critères d’acceptation

- je vois les restaurants sur une carte,
- je peux distinguer rapidement les mieux notés,
- je peux cliquer sur un pin pour voir plus de détails.

---

# 7.7 Filtrer les restaurants

## Objectif

Réduire la liste aux options pertinentes du moment.

## Filtres obligatoires du MVP

- sur place,
- à emporter,
- prix.

## Définition des filtres

### Sur place

- n’afficher que les restaurants avec `dineIn = true`

### À emporter

- n’afficher que les restaurants avec `takeAway = true`

### Prix

- filtrage par borne ou tranche.

## Recommandation vibecodable

Pour aller vite, choisir **une seule représentation du prix** côté UX :

- soit un **slider / borne max**, ex. “moins de 15€”
- soit des **tranches** : €, €€, €€€, €€€€

Le plus simple pour un MVP fun et lisible : **tranches de prix**.

## Règles métier

- les filtres s’appliquent à la carte,
- les filtres s’appliquent à la liste,
- les filtres s’appliquent au tirage aléatoire,
- les filtres sont combinables,
- un bouton de reset doit être disponible.

## Critères d’acceptation

- je peux filtrer par sur place,
- je peux filtrer par à emporter,
- je peux filtrer par prix,
- le résultat affiché est cohérent sur tous les écrans.

---

# 7.8 Ajouter aux favoris

## Objectif

Permettre à chacun de retrouver rapidement ses restaurants préférés.

## Comportement attendu

- depuis la fiche restaurant ou la carte, l’utilisateur peut cliquer sur une icône favori,
- le restaurant est ajouté à sa liste de favoris,
- il peut retirer un favori à tout moment.

## Règles métier

- les favoris sont propres à l’utilisateur,
- un restaurant favori doit être identifiable visuellement,
- l’utilisateur doit pouvoir accéder à une vue “Mes favoris”.

## Critères d’acceptation

- je peux ajouter un favori,
- je peux retirer un favori,
- je peux afficher mes favoris.

---

# 7.9 Tirage aléatoire “Keskon mange ?”

## Objectif

Aider le groupe à prendre une décision immédiatement.

## Déclenchement

Un CTA principal doit être visible dans l’application, par exemple :

- “Keskon mange ?”
- “Choisis pour nous”
- “Roulette du dej”

## Comportement attendu

Quand l’utilisateur lance le tirage :

1. l’application récupère les restaurants éligibles,
2. applique les filtres actifs,
3. exclut les restaurants fermés / indisponibles,
4. choisit un restaurant aléatoire,
5. affiche une animation légère,
6. **zoome sur le restaurant sur la carte**,
7. ouvre sa popup ou sa fiche simplifiée,
8. propose une action “Relancer”.

## Règles métier

- le tirage doit être réalisé **uniquement parmi les résultats filtrés**,
- si aucun restaurant n’est disponible, afficher un message clair,
- le restaurant sélectionné doit être clairement mis en avant visuellement,
- le zoom doit être automatique et compréhensible sur mobile.

## Décision produit recommandée

Le tirage est **uniforme** dans le MVP : tous les restaurants éligibles ont la même probabilité.

Cela évite d’introduire trop tôt :

- pondération par note,
- pondération par distance,
- règles complexes.

## Critères d’acceptation

- je peux lancer un tirage depuis l’écran principal,
- le résultat respecte les filtres actifs,
- la carte zoome sur le restaurant choisi,
- je peux relancer un tirage facilement.

---

## 8. Parcours utilisateurs principaux

# 8.1 Parcours “Trouver vite un resto”

1. L’utilisateur ouvre l’application.
2. Il voit la carte et les restaurants.
3. Il applique éventuellement un filtre.
4. Il consulte 1 à 3 fiches.
5. Il choisit un restaurant.

### Succès

L’utilisateur trouve une option sans friction.

# 8.2 Parcours “Ajouter une nouvelle adresse”

1. L’utilisateur clique sur “Ajouter”.
2. Il remplit le formulaire.
3. Il valide.
4. Le restaurant apparaît immédiatement.

### Succès

Le restaurant est correctement positionné et consultable.

---

# 8.3 Parcours “Partager mon avis”

1. L’utilisateur ouvre une fiche.
2. Il clique sur “Ajouter mon avis”.
3. Il renseigne une note, un commentaire et éventuellement des photos.
4. Il valide.
5. La note moyenne est mise à jour.

### Succès

La contribution est visible immédiatement.

---

# 8.4 Parcours “On n’arrive pas à se décider”

1. Les utilisateurs appliquent éventuellement des filtres.
2. Ils cliquent sur “Keskon mange ?”.
3. Une animation de sélection se lance.
4. Un restaurant est choisi.
5. La carte zoome dessus.
6. Les utilisateurs peuvent accepter ou relancer.

### Succès

Le groupe gagne du temps et le résultat est fun à utiliser.

---

## 9. Écrans du MVP

# 9.1 Écran principal

Contient :

- carte,
- liste ou panneau des restaurants,
- filtres,
- CTA de tirage aléatoire,
- accès aux favoris,
- action d’ajout.

## Objectif

C’est l’écran pivot de l’application.

---

# 9.2 Fiche restaurant

Contient :

- infos du restaurant,
- galerie photos,
- avis,
- boutons d’action.

---

# 9.3 Formulaire restaurant

Contient :

- nom,
- adresse,
- type,
- labels,
- prix,
- sur place,
- à emporter,
- statut.

---

# 9.4 Formulaire avis

Contient :

- note,
- commentaire,
- upload photo.

---

# 9.5 Vue favoris

Contient :

- les restaurants favoris de l’utilisateur,
- avec possibilité d’ouvrir la carte ou la fiche.

---

## 10. Cas limites à couvrir

### Cas 1 — Aucun restaurant

- afficher un état vide clair,
- proposer d’ajouter le premier restaurant.

### Cas 2 — Aucun résultat avec les filtres

- afficher “Aucun resto ne correspond à tes filtres”,
- proposer de réinitialiser.

### Cas 3 — Tirage impossible

- si la liste filtrée est vide, ne pas lancer de tirage,
- afficher une explication.

### Cas 4 — Restaurant sans avis

- afficher “Pas encore noté” ou “Nouveau”.

### Cas 5 — Doublon probable

- alerter avant création,
- permettre d’abandonner ou de créer quand même.

### Cas 6 — Avis déjà existant

- remplacer “Ajouter un avis” par “Modifier mon avis”.

### Cas 7 — Adresse mal géocodée

- permettre de corriger la position ou au moins d’éditer l’adresse.

---

## 11. Règles de calcul

# 11.1 Note moyenne

- moyenne arithmétique des notes actives,
- arrondie à 1 décimale pour l’affichage.

# 11.2 Nombre d’avis

- nombre total d’avis actifs liés au restaurant.

# 11.3 Éligibilité au tirage

Un restaurant est éligible si :

- il est actif,
- il correspond aux filtres,
- il possède des coordonnées valides.

---

## 12. Règles d’autorisation MVP

### Utilisateur connecté

Peut :

- voir les restaurants,
- ajouter un restaurant,
- modifier un restaurant,
- ajouter/modifier/supprimer son avis,
- ajouter/retirer ses favoris.

### Arbitrage MVP recommandé

- édition des restaurants : collaborative ouverte,
- édition des avis : uniquement par leur auteur.

---

## 13. Exigences UX/UI

## Ton attendu

L’application doit être sympa, un peu drôle, jamais lourde.

### Exemples de microcopy

- “Keskon mange aujourd’hui ?”
- “Le destin a parlé.”
- “Tu veux relancer la machine du dej ?”
- “Pas d’inspi ? On choisit pour toi.”
- “Aucun resto ne matche. Même la carte a faim.”

## Principes UX

- interface mobile en priorité,
- actions principales visibles sans effort,
- carte lisible,
- feedback immédiat après chaque action,
- tirage aléatoire très visible,
- pas plus de complexité que nécessaire.

---

## 14. Critères de réussite produit

Le MVP est réussi si un utilisateur peut :

1. ouvrir l’app et comprendre immédiatement son but,
2. trouver des restaurants sur une carte,
3. filtrer selon ses besoins,
4. consulter notes et avis,
5. ajouter une adresse ou un avis sans friction,
6. lancer un tirage aléatoire crédible et lisible,
7. sauvegarder ses favoris.

---

## 15. Découpage en epics pour coder vite

# Epic 1 — Base restaurants

- créer un restaurant
- modifier un restaurant
- lister les restaurants
- voir une fiche restaurant
- gérer le statut du restaurant

# Epic 2 — Carte

- afficher les restaurants sur une carte
- ouvrir un aperçu au clic
- afficher la note sur les marqueurs
- zoomer sur un restaurant ciblé

# Epic 3 — Avis et photos

- créer un avis
- modifier son avis
- supprimer son avis
- uploader des photos
- recalculer la note moyenne

# Epic 4 — Filtres

- filtrer sur place
- filtrer à emporter
- filtrer sur le prix
- réinitialiser les filtres
- appliquer les filtres à la carte et au tirage

# Epic 5 — Favoris

- ajouter un favori
- retirer un favori
- afficher mes favoris

# Epic 6 — Tirage aléatoire

- lancer le tirage
- exclure les restaurants non éligibles
- afficher une animation
- zoomer sur le restaurant choisi
- permettre de relancer

---

## 16. Priorisation de build recommandée

### Sprint / lot 1

- auth simple
- modèle restaurant
- ajout / édition restaurant
- affichage liste + carte

### Sprint / lot 2

- fiche restaurant
- avis
- note moyenne
- upload photo

### Sprint / lot 3

- filtres
- favoris
- tirage aléatoire
- zoom sur map
- polish fun

---

## 17. Version ultra synthétique pour lancement de dev

**Keskon mange** est une app collaborative de décision déjeuner.

Le MVP doit permettre à des utilisateurs connectés de :

- ajouter et modifier des restaurants,
- renseigner type, labels, prix, sur place / à emporter,
- laisser un avis avec note, commentaire et photos,
- voir les restaurants sur une carte avec note visible,
- filtrer les restaurants par sur place, à emporter et prix,
- sauvegarder des favoris,
- lancer un tirage aléatoire parmi les restaurants filtrés,
- zoomer automatiquement sur le restaurant sélectionné.

La carte est l’écran central. Le ton doit être fun. L’expérience doit être rapide, mobile-friendly et collaborative.

---

## 18. Arbitrages produit conseillés pour éviter les débats en build

Pour rester vibecodable :

- **1 avis par utilisateur par restaurant**,
- **tirage uniforme** sans pondération,
- **prix en tranches** plutôt qu’en valeur libre,
- **édition collaborative des restaurants**,
- **favoris individuels**,
- **restaurants fermés exclus du tirage**,
- **fiche simple mais dense**, sans sous-niveaux complexes.

Ces choix réduisent fortement la complexité produit et technique tout en gardant toute la valeur du concept.

J’ai préparé une version plus solide et directement exploitable pour construire vite.

Elle contient :

- un **MVP cadré**,
- les **objets métier**,
- les **règles produit**,
- les **parcours utilisateurs**,
- les **cas limites**,
- les **critères d’acceptation**,
- et un **découpage en epics** pour enchaîner sur le build.

Le point le plus important : j’ai pris quelques **arbitrages qui évitent les débats inutiles** pendant le dev, par exemple :

- **1 avis par utilisateur par restaurant**,
- **tirage aléatoire uniforme**,
- **prix en tranches**,
- **édition collaborative des restaurants**,
- **favoris personnels**.

Si tu veux, l’étape la plus utile maintenant est que je te transforme ça en **tickets vibecoding-ready** avec :

**Epic > user stories > critères d’acceptation > schéma de données > routes/API > composants UI**.
