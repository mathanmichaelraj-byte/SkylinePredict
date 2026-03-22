import { pgTable, text, serial, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);

export const areasTable = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  avgPricePerSqft: real("avg_price_per_sqft").notNull(),
  valueScore: real("value_score").notNull(),
  futureScore: real("future_score").notNull(),
  sentiment: sentimentEnum("sentiment").notNull(),
  propertyCount: integer("property_count").notNull(),
  appreciation1y: real("appreciation_1y").notNull(),
  appreciation3y: real("appreciation_3y").notNull(),
});

export const insertAreaSchema = createInsertSchema(areasTable).omit({ id: true });
export type InsertArea = z.infer<typeof insertAreaSchema>;
export type Area = typeof areasTable.$inferSelect;
