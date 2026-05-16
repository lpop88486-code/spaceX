import { json, cors, err, stripeRequest } from "./_utils.mjs";
import { PLANS } from "./_plans.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();

  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId) return err("Missing session_id", 400);

  try {
    const session = await stripeRequest(`/checkout/sessions/${sessionId}`, "GET", {
      expand: ["subscription", "customer"],
    });

    const planId = Number(session.metadata?.planId);
    const plan = PLANS.find((p) => p.id === planId);

    return json({
      success: session.payment_status === "paid" || session.status === "complete",
      subscription: {
        id: session.subscription?.id || session.id,
        planName: session.metadata?.planName || plan?.name || "Starlink Plan",
        planCategory: session.metadata?.planCategory || plan?.category || "",
        priceMonthly: plan?.priceMonthly || 0,
        status: session.subscription?.status || "active",
        address: session.metadata?.address || "",
        customerName: session.metadata?.customerName || "",
        email: session.customer_details?.email || "",
        createdAt: new Date(session.created * 1000).toISOString(),
        stripeSubscriptionId: session.subscription?.id,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
      },
    });
  } catch (e) {
    console.error("checkout-success error:", e.message);
    return err(e.message, 500);
  }
};
