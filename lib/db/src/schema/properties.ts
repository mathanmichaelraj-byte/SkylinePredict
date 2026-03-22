import { pgTable, text, serial, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertyTypeEnum = pgEnum("property_type", ["plot", "flat", "house", "villa"]);
export const valueLabelEnum = pgEnum("value_label", ["green", "red", "blue"]);
export const futureOutlookEnum = pgEnum("future_outlook", ["low", "medium", "high"]);
export const verificationStatusEnum = pgEnum("verification_status", ["unverified", "partial", "verified"]);

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  address: text("address").notNull(),
  area: text("area").notNull(),
  city: text("city").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  type: propertyTypeEnum("type").notNull(),
  areaSqft: real("area_sqft").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  askingPrice: real("asking_price").notNull(),
  fairPriceMin: real("fair_price_min").notNull(),
  fairPriceMax: real("fair_price_max").notNull(),
  pricePerSqft: real("price_per_sqft").notNull(),
  valueLabel: valueLabelEnum("value_label").notNull(),
  valueScore: real("value_score").notNull(),
  futureOutlook: futureOutlookEnum("future_outlook").notNull(),
  connectivityScore: real("connectivity_score").notNull(),
  verificationStatus: verificationStatusEnum("verification_status").notNull(),
  yearBuilt: integer("year_built"),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
