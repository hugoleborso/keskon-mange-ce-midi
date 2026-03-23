import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	real,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────

export const priceRangeEnum = pgEnum("price_range", ["EUR_1", "EUR_2", "EUR_3", "EUR_4"]);

export const restaurantStatusEnum = pgEnum("restaurant_status", [
	"active",
	"temporarily_closed",
	"permanently_closed",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// ─── Auth.js tables ──────────────────────────────────────

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name"),
	email: text("email").unique().notNull(),
	emailVerified: timestamp("email_verified", { mode: "date" }),
	image: text("image"),
	role: userRoleEnum("role").default("user").notNull(),
});

export const accounts = pgTable(
	"accounts",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("provider_account_id").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
	sessionToken: text("session_token").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
	"verification_tokens",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: timestamp("expires", { mode: "date" }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// ─── App tables ──────────────────────────────────────────

export const categories = pgTable("categories", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").unique().notNull(),
	slug: text("slug").unique().notNull(),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const restaurants = pgTable("restaurants", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	address: text("address").notNull(),
	latitude: real("latitude").notNull(),
	longitude: real("longitude").notNull(),
	restaurantType: text("restaurant_type"),
	categoryId: text("category_id").references(() => categories.id),
	labels: text("labels").array(),
	priceRange: priceRangeEnum("price_range"),
	dineIn: boolean("dine_in").default(true).notNull(),
	takeAway: boolean("take_away").default(false).notNull(),
	status: restaurantStatusEnum("status").default("active").notNull(),
	photoCoverUrl: text("photo_cover_url"),
	createdBy: text("created_by")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const reviews = pgTable(
	"reviews",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		restaurantId: text("restaurant_id")
			.notNull()
			.references(() => restaurants.id, { onDelete: "cascade" }),
		authorId: text("author_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		rating: integer("rating").notNull(),
		comment: text("comment"),
		photoUrls: text("photo_urls").array(),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
	},
	(table) => [unique().on(table.restaurantId, table.authorId)],
);

export const lunchAttendance = pgTable(
	"lunch_attendance",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		restaurantId: text("restaurant_id")
			.notNull()
			.references(() => restaurants.id, { onDelete: "cascade" }),
		date: text("date").notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.date] })],
);

export const reviewLikes = pgTable(
	"review_likes",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		reviewId: text("review_id")
			.notNull()
			.references(() => reviews.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.reviewId] })],
);

export const favorites = pgTable(
	"favorites",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		restaurantId: text("restaurant_id")
			.notNull()
			.references(() => restaurants.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.restaurantId] })],
);
