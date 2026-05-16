import { Router } from "express";
import { db } from "@workspace/db";
import { plansTable, subscriptionsTable } from "@workspace/db";
import { eq, desc, count, gte, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const JWT_SECRET = process.env.SESSION_SECRET ?? "spacex-starlink-secret";

function adminAuth(req: any, res: any, next: any): void {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const { password } = req.body as { password: string };
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ success: true, token });
});

router.get("/admin/stats", adminAuth, async (req, res): Promise<void> => {
  try {
    const [totalRow] = await db.select({ total: count() }).from(subscriptionsTable);
    const [activeRow] = await db
      .select({ total: count() })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "active"));
    const [cancelledRow] = await db
      .select({ total: count() })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "cancelled"));

    const activeRevenue = await db
      .select({ revenue: plansTable.priceMonthly })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.status, "active"));

    const monthlyRevenue = activeRevenue.reduce(
      (acc, r) => acc + parseFloat(r.revenue ?? "0"),
      0
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [newThisMonthRow] = await db
      .select({ total: count() })
      .from(subscriptionsTable)
      .where(gte(subscriptionsTable.createdAt, startOfMonth));

    const planBreakdownRows = await db
      .select({
        planName: plansTable.name,
        planCount: count(),
        revenue: sql<string>`coalesce(sum(${plansTable.priceMonthly}), 0)`,
      })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.status, "active"))
      .groupBy(plansTable.name);

    const recentRows = await db
      .select({ sub: subscriptionsTable, plan: plansTable })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(5);

    res.json({
      totalSubscriptions: totalRow.total,
      activeSubscriptions: activeRow.total,
      cancelledSubscriptions: cancelledRow.total,
      monthlyRevenue,
      totalRevenue: monthlyRevenue,
      newThisMonth: newThisMonthRow.total,
      planBreakdown: planBreakdownRows.map((r) => ({
        planName: r.planName ?? "Unknown",
        count: r.planCount,
        revenue: parseFloat(r.revenue),
      })),
      recentSubscriptions: recentRows.map((r) => ({
        id: r.sub.id,
        email: r.sub.email,
        name: r.sub.name,
        planId: r.sub.planId,
        planName: r.plan?.name ?? "",
        planCategory: r.plan?.category ?? "",
        priceMonthly: r.plan ? parseFloat(r.plan.priceMonthly) : 0,
        stripeSubscriptionId: r.sub.stripeSubscriptionId,
        stripeCustomerId: r.sub.stripeCustomerId,
        status: r.sub.status,
        address: r.sub.address,
        createdAt: r.sub.createdAt,
        cancelledAt: r.sub.cancelledAt,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/admin/plans", adminAuth, async (req, res): Promise<void> => {
  try {
    const plans = await db.select().from(plansTable).orderBy(plansTable.priceMonthly);
    res.json(
      plans.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        speed: p.speed,
        priceMonthly: parseFloat(p.priceMonthly),
        features: p.features,
        stripePriceId: p.stripePriceId,
        active: p.active,
        popular: p.popular,
        description: p.description,
        hardwarePrice: p.hardwarePrice ? parseFloat(p.hardwarePrice) : undefined,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to admin list plans");
    res.status(500).json({ error: "Failed to list plans" });
  }
});

router.post("/admin/plans", adminAuth, async (req, res): Promise<void> => {
  try {
    const { name, category, speed, priceMonthly, features, stripePriceId, popular, description, hardwarePrice } =
      req.body as {
        name: string;
        category: string;
        speed: string;
        priceMonthly: number;
        features: string[];
        stripePriceId?: string;
        popular?: boolean;
        description: string;
        hardwarePrice?: number;
      };
    const [plan] = await db
      .insert(plansTable)
      .values({
        name,
        category,
        speed,
        priceMonthly: String(priceMonthly),
        features: features ?? [],
        stripePriceId,
        popular: popular ?? false,
        description,
        hardwarePrice: hardwarePrice ? String(hardwarePrice) : null,
      })
      .returning();
    res.status(201).json({
      ...plan,
      priceMonthly: parseFloat(plan.priceMonthly),
      hardwarePrice: plan.hardwarePrice ? parseFloat(plan.hardwarePrice) : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create plan");
    res.status(500).json({ error: "Failed to create plan" });
  }
});

router.patch("/admin/plans/:id", adminAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.speed !== undefined) updateData.speed = body.speed;
    if (body.priceMonthly !== undefined) updateData.priceMonthly = String(body.priceMonthly);
    if (body.features !== undefined) updateData.features = body.features;
    if (body.stripePriceId !== undefined) updateData.stripePriceId = body.stripePriceId;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.popular !== undefined) updateData.popular = body.popular;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.hardwarePrice !== undefined)
      updateData.hardwarePrice = body.hardwarePrice ? String(body.hardwarePrice) : null;

    const [updated] = await db
      .update(plansTable)
      .set(updateData)
      .where(eq(plansTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json({
      ...updated,
      priceMonthly: parseFloat(updated.priceMonthly),
      hardwarePrice: updated.hardwarePrice ? parseFloat(updated.hardwarePrice) : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update plan");
    res.status(500).json({ error: "Failed to update plan" });
  }
});

router.delete("/admin/plans/:id", adminAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [updated] = await db
      .update(plansTable)
      .set({ active: false })
      .where(eq(plansTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json({
      ...updated,
      priceMonthly: parseFloat(updated.priceMonthly),
      hardwarePrice: updated.hardwarePrice ? parseFloat(updated.hardwarePrice) : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to deactivate plan");
    res.status(500).json({ error: "Failed to deactivate plan" });
  }
});

router.get("/admin/revenue", adminAuth, async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        month: sql<string>`to_char(${subscriptionsTable.createdAt}, 'YYYY-MM')`,
        revenue: sql<string>`coalesce(sum(${plansTable.priceMonthly}), 0)`,
        subscriptionCount: count(),
      })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.status, "active"))
      .groupBy(sql`to_char(${subscriptionsTable.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${subscriptionsTable.createdAt}, 'YYYY-MM')`);

    res.json({
      monthly: rows.map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue),
        subscriptions: r.subscriptionCount,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get revenue stats");
    res.status(500).json({ error: "Failed to get revenue stats" });
  }
});

export default router;
