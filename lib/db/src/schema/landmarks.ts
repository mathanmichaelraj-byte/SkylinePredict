import { pgTable, text, serial, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const landmarkTypeEnum = pgEnum("landmark_type", ["metro", "school", "hospital", "it_park", "mall", "bus_stop", "highway"]);

export const landmarksTable = pgTable("landmarks", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  name: text("name").notNull(),
  type: landmarkTypeEnum("type").notNull(),
  distanceKm: real("distance_km").notNull(),
});

export const insertLandmarkSchema = createInsertSchema(landmarksTable).omit({ id: true });
export type InsertLandmark = z.infer<typeof insertLandmarkSchema>;
export type Landmark = typeof landmarksTable.$inferSelect;
