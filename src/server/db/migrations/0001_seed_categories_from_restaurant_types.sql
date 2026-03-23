-- Seed categories from hardcoded RESTAURANT_TYPES
INSERT INTO "categories" ("id", "name", "slug", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'Italien', 'italien', now(), now()),
  (gen_random_uuid(), 'Japonais', 'japonais', now(), now()),
  (gen_random_uuid(), 'Chinois', 'chinois', now(), now()),
  (gen_random_uuid(), 'Burger', 'burger', now(), now()),
  (gen_random_uuid(), 'Libanais', 'libanais', now(), now()),
  (gen_random_uuid(), 'Indien', 'indien', now(), now()),
  (gen_random_uuid(), 'Thaï', 'thai', now(), now()),
  (gen_random_uuid(), 'Mexicain', 'mexicain', now(), now()),
  (gen_random_uuid(), 'Sandwicherie', 'sandwicherie', now(), now()),
  (gen_random_uuid(), 'Végétarien', 'vegetarien', now(), now()),
  (gen_random_uuid(), 'Brunch', 'brunch', now(), now()),
  (gen_random_uuid(), 'Bistrot', 'bistrot', now(), now()),
  (gen_random_uuid(), 'Pizza', 'pizza', now(), now()),
  (gen_random_uuid(), 'Sushi', 'sushi', now(), now()),
  (gen_random_uuid(), 'Kebab', 'kebab', now(), now()),
  (gen_random_uuid(), 'Autre', 'autre', now(), now())
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint

-- Backfill categoryId on restaurants from restaurantType
UPDATE "restaurants"
SET "category_id" = "categories"."id"
FROM "categories"
WHERE "restaurants"."restaurant_type" IS NOT NULL
  AND "restaurants"."category_id" IS NULL
  AND "categories"."slug" = lower("restaurants"."restaurant_type");
