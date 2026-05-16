import { json, cors, err, requireAdmin, stripeRequest } from "./_utils.mjs";
import { PLANS } from "./_plans.mjs";

const DEMO_SUBS = Array.from({ length: 20 }, (_, i) => {
  const plan = PLANS[i % PLANS.length];
  const statuses = ["active", "active", "active", "active", "cancelled"];
  return {
    id: i + 1,
    email: `customer${i + 1}@example.com`,
    name: `Customer ${i + 1}`,
    planId: plan.id,
    planName: plan.name,
    planCategory: plan.category,
    priceMonthly: plan.priceMonthly,
    status: statuses[i % statuses.length],
    address: `${100 + i} Main St, City, Country`,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    cancelledAt: statuses[i % statuses.length] === "cancelled" ? new Date(Date.now() - i * 86400000).toISOString() : null,
  };
});

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();

  try {
    requireAdmin(event);
  } catch {
    return err("Unauthorized", 401);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  const statusFilter = event.queryStringParameters?.status;
  const limit = Number(event.queryStringParameters?.limit) || 50;

  if (!stripeKey || stripeKey.startsWith("sk_test_placeholder")) {
    const filtered = statusFilter && statusFilter !== "all"
      ? DEMO_SUBS.filter((s) => s.status === statusFilter)
      : DEMO_SUBS;
    return json({ subscriptions: filtered.slice(0, limit), total: filtered.length });
  }

  try {
    const params = { limit: Math.min(limit, 100) };
    if (statusFilter && statusFilter !== "all") params.status = statusFilter === "cancelled" ? "canceled" : statusFilter;

    const data = await stripeRequest("/subscriptions", "GET", params);
    const subs = (data.data || []).map((s, i) => {
      const planId = Number(s.metadata?.planId);
      const plan = PLANS.find((p) => p.id === planId);
      return {
        id: i + 1,
        email: s.metadata?.customerEmail || "",
        name: s.metadata?.customerName || "",
        planId: planId || null,
        planName: s.metadata?.planName || plan?.name || "Unknown",
        planCategory: plan?.category || "",
        priceMonthly: plan?.priceMonthly || (s.items?.data?.[0]?.price?.unit_amount || 0) / 100,
        status: s.status === "canceled" ? "cancelled" : s.status,
        address: s.metadata?.address || "",
        stripeSubscriptionId: s.id,
        stripeCustomerId: s.customer,
        createdAt: new Date(s.created * 1000).toISOString(),
        cancelledAt: s.canceled_at ? new Date(s.canceled_at * 1000).toISOString() : null,
      };
    });

    return json({ subscriptions: subs, total: subs.length });
  } catch (e) {
    console.error("get-subscriptions error:", e.message);
    const filtered = statusFilter && statusFilter !== "all"
      ? DEMO_SUBS.filter((s) => s.status === statusFilter)
      : DEMO_SUBS;
    return json({ subscriptions: filtered.slice(0, limit), total: filtered.length });
  }
};
