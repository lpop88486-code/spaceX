import { json, cors, err, stripeRequest } from "./_utils.mjs";
import { PLANS } from "./_plans.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();
  if (event.httpMethod !== "POST") return err("Method not allowed", 405);

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return err("Invalid JSON body");
  }

  const { planId, name, email, address, successUrl, cancelUrl } = body;
  const plan = PLANS.find((p) => p.id === Number(planId));
  if (!plan) return err("Plan not found", 404);

  try {
    const params = {
      mode: "subscription",
      success_url: successUrl || `${event.headers.origin || ""}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${event.headers.origin || ""}/plans`,
      customer_email: email,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": `Starlink ${plan.name}`,
      "line_items[0][price_data][product_data][description]": plan.description,
      "line_items[0][price_data][unit_amount]": String(plan.priceMonthly * 100),
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][quantity]": "1",
      "metadata[planId]": String(plan.id),
      "metadata[planName]": plan.name,
      "metadata[planCategory]": plan.category,
      "metadata[customerName]": name || "",
      "metadata[address]": address || "",
      "subscription_data[metadata][planId]": String(plan.id),
      "subscription_data[metadata][planName]": plan.name,
      "subscription_data[metadata][address]": address || "",
      "subscription_data[metadata][customerName]": name || "",
    };

    if (plan.hardwarePrice) {
      params["line_items[1][price_data][currency]"] = "usd";
      params["line_items[1][price_data][product_data][name]"] = "Starlink Hardware Kit";
      params["line_items[1][price_data][product_data][description]"] = "One-time hardware purchase";
      params["line_items[1][price_data][unit_amount]"] = String(plan.hardwarePrice * 100);
      params["line_items[1][quantity]"] = "1";
    }

    const session = await stripeRequest("/checkout/sessions", "POST", params);
    return json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("Stripe checkout error:", e.message);
    return err(e.message, 500);
  }
};
