import { pgTable, text, serial, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsTopicEnum = pgEnum("news_topic", ["infra", "policy", "jobs", "environment", "legal", "development", "business", "market"]);

export const newsTable = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  area: text("area").notNull(),
  city: text("city").notNull(),
  sentiment: text("sentiment").notNull(),
  topic: newsTopicEnum("topic").notNull(),
  publishedAt: timestamp("published_at"),
  summary: text("summary"),  
});

export const insertNewsSchema = createInsertSchema(newsTable).omit({ id: true });
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof newsTable.$inferSelect;
