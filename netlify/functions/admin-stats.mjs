import { json, cors, err, requireAdmin, stripeRequest } from "./_utils.mjs";
import { PLANS } from "./_plans.mjs";

const DEMO_STATS = {
  totalSubscriptions: 57,
  activeSubscriptions: 52,
  cancelledSubscriptions: 5,
  monthlyRevenue: 12100,
  totalRevenue: 12100,
  newThisMonth: 9,
  planBreakdown: [
    { planName: "Residential", count: 22, revenue: 2640 },
    { planName: "Priority", count: 14, revenue: 3500 },
    { planName: "Mobile", count: 8, revenue: 1200 },
    { planName: "Business", count: 6, revenue: 3000 },
    { planName: "Maritime", count: 2, revenue: 500 },
  ],
  recentSubscriptions: [
    { id: 1, email: "user1@example.com", name: "Alex Johnson", planName: "Residential", priceMonthly: 120, status: "active", createdAt: new Date().toISOString() },
    { id: 2, email: "user2@example.com", name: "Maria Garcia", planName: "Priority", priceMonthly: 250, status: "active", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, email: "user3@example.com", name: "James Lee", planName: "Business", priceMonthly: 500, status: "active", createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 4, email: "user4@example.com", name: "Sarah Kim", planName: "Mobile", priceMonthly: 150, status: "active", createdAt: new Date(Date.now() - 259200000).toISOString() },
    { id: 5, email: "user5@example.com", name: "Chris Brown", planName: "Residential", priceMonthly: 120, status: "cancelled", createdAt: new Date(Date.now() - 604800000).toISOString() },
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
    return json(DEMO_STATS);
  }

  try {
    const [subsData, sessionsData] = await Promise.all([
      stripeRequest("/subscriptions", "GET", { limit: 100, status: "all" }),
      stripeRequest("/checkout/sessions", "GET", { limit: 20, status: "complete" }),
    ]);

    const allSubs = subsData.data || [];
    const activeSubs = allSubs.filter((s) => s.status === "active" || s.status === "trialing");
    const cancelledSubs = allSubs.filter((s) => s.status === "canceled");

    const mrr = activeSubs.reduce((acc, s) => {
      const item = s.items?.data?.[0];
      if (!item) return acc;
      const amount = item.price?.unit_amount || 0;
      const interval = item.price?.recurring?.interval;
      return acc + (interval === "month" ? amount / 100 : interval === "year" ? amount / 100 / 12 : 0);
    }, 0);

    const startOfMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000);
    const newThisMonth = allSubs.filter((s) => s.created >= startOfMonth).length;

    const planBreakdownMap = {};
    for (const s of activeSubs) {
      const planName = s.metadata?.planName || "Unknown";
      const amount = (s.items?.data?.[0]?.price?.unit_amount || 0) / 100;
      if (!planBreakdownMap[planName]) planBreakdownMap[planName] = { planName, count: 0, revenue: 0 };
      planBreakdownMap[planName].count++;
      planBreakdownMap[planName].revenue += amount;
    }

    const recentSessions = (sessionsData.data || []).slice(0, 5).map((sess, i) => ({
      id: i + 1,
      email: sess.customer_details?.email || "",
      name: sess.metadata?.customerName || sess.customer_details?.name || "",
      planName: sess.metadata?.planName || "Unknown",
      priceMonthly: Number(sess.metadata?.planId ? (PLANS.find((p) => String(p.id) === sess.metadata.planId)?.priceMonthly || 0) : 0),
      status: "active",
      address: sess.metadata?.address || "",
      stripeSubscriptionId: typeof sess.subscription === "string" ? sess.subscription : sess.subscription?.id,
      createdAt: new Date(sess.created * 1000).toISOString(),
    }));

    return json({
      totalSubscriptions: allSubs.length,
      activeSubscriptions: activeSubs.length,
      cancelledSubscriptions: cancelledSubs.length,
      monthlyRevenue: Math.round(mrr),
      totalRevenue: Math.round(mrr),
      newThisMonth,
      planBreakdown: Object.values(planBreakdownMap),
      recentSubscriptions: recentSessions.length ? recentSessions : DEMO_STATS.recentSubscriptions,
    });
  } catch (e) {
    console.error("admin-stats error:", e.message);
    return json(DEMO_STATS);
  }
};
