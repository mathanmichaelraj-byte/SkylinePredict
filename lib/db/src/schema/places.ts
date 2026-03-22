import { pgTable, text, serial, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const placesTable = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  area: text("area").notNull(),
  city: text("city").notNull(),
  rating: real("rating"),
  ratingCount: integer("rating_count"),
  address: text("address"),
});

export const insertPlaceSchema = createInsertSchema(placesTable).omit({ id: true });
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof placesTable.$inferSelect;
