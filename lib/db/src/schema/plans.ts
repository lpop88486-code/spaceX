import { pgTable, serial, text, decimal, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // residential | roam | business
  speed: text("speed").notNull(),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  features: jsonb("features").notNull().$type<string[]>(),
  stripePriceId: text("stripe_price_id"),
  active: boolean("active").notNull().default(true),
  popular: boolean("popular").notNull().default(false),
  description: text("description").notNull(),
  hardwarePrice: decimal("hardware_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
