import { pgTable, text, serial, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const priceHistoryTable = pgTable("price_history", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  month: text("month").notNull(),
  pricePerSqft: real("price_per_sqft").notNull(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistoryTable).omit({ id: true });
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistoryTable.$inferSelect;
