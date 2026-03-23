export const RESTAURANT_TYPES = [
	"italien",
	"japonais",
	"chinois",
	"burger",
	"libanais",
	"indien",
	"thai",
	"mexicain",
	"sandwicherie",
	"vegetarien",
	"brunch",
	"bistrot",
	"pizza",
	"sushi",
	"kebab",
	"autre",
] as const;

export const LABELS = [
	"halal",
	"veggie-friendly",
	"vegan-friendly",
	"sans-gluten",
	"rapide",
	"terrasse",
	"groupe",
	"bon-rapport-qualite-prix",
	"copieux",
] as const;

export const PRICE_RANGES = ["EUR_1", "EUR_2", "EUR_3", "EUR_4"] as const;

export type PriceRange = (typeof PRICE_RANGES)[number];

export const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
	EUR_1: "€",
	EUR_2: "€€",
	EUR_3: "€€€",
	EUR_4: "€€€€",
};

export const PRICE_RANGE_DESCRIPTIONS: Record<PriceRange, string> = {
	EUR_1: "€ — moins de 10€",
	EUR_2: "€€ — 10 à 13€",
	EUR_3: "€€€ — 13 à 18€",
	EUR_4: "€€€€ — plus de 18€",
};

export const RESTAURANT_STATUSES = ["active", "temporarily_closed", "permanently_closed"] as const;
