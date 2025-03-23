import { numeric, pgTable, text } from "drizzle-orm/pg-core";

// Users table with address and points (XP)
export const users = pgTable("users", {
  address: text("address").primaryKey(),
  points: numeric("points").default("0"),
});

// Boosts table with protocols and multipliers
export const boosts = pgTable("boosts", {
  protocol: text("protocol").primaryKey(),
  multiplier: numeric("multiplier").notNull(),
});
