CREATE TABLE "boosts" (
	"protocol" text PRIMARY KEY NOT NULL,
	"multiplier" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"address" text PRIMARY KEY NOT NULL,
	"points" numeric DEFAULT '0'
);
