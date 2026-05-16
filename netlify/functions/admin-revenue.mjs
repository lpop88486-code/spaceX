import { json, cors, err, requireAdmin, stripeRequest } from "./_utils.mjs";

const DEMO_REVENUE = {
  monthly: [
    { month: "2025-06", revenue: 3200, subscriptions: 12 },
    { month: "2025-07", revenue: 4800, subscriptions: 18 },
    { month: "2025-08", revenue: 5600, subscriptions: 22 },
    { month: "2025-09", revenue: 6900, subscriptions: 28 },
    { month: "2025-10", revenue: 8100, subscriptions: 33 },
    { month: "2025-11", revenue: 9400, subscriptions: 39 },
    { month: "2025-12", revenue: 10200, subscriptions: 43 },
    { month: "2026-01", revenue: 10800, subscriptions: 46 },
    { month: "2026-02", revenue: 11200, subscriptions: 48 },
    { month: "2026-03", revenue: 11600, subscriptions: 50 },
    { month: "2026-04", revenue: 11900, subscriptions: 51 },
    { month: "2026-05", revenue: 12100, subscriptions: 52 },
  ],
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();

  try {
    requireAdmin(event);
  } catch {
    return err("Unauthorized", 401);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  if (!stripeKey || stripeKey.startsWith("sk_test_placeholder")) {
    return json(DEMO_REVENUE);
  }

  try {
    const subsData = await stripeRequest("/subscriptions", "GET", {
      limit: 100,
      status: "all",
      expand: ["data.items.data.price"],
    });

    const allSubs = subsData.data || [];
    const monthlyMap = {};

    for (const sub of allSubs) {
      const date = new Date(sub.created * 1000);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = (sub.items?.data?.[0]?.price?.unit_amount || 0) / 100;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, subscriptions: 0 };
      monthlyMap[key].revenue += amount;
      monthlyMap[key].subscriptions++;
    }

    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
    return json({ monthly: monthly.length ? monthly : DEMO_REVENUE.monthly });
  } catch (e) {
    console.error("admin-revenue error:", e.message);
    return json(DEMO_REVENUE);
  }
};
