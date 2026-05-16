import { json, cors, err, requireAdmin, stripeRequest } from "./_utils.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();

  try {
    requireAdmin(event);
  } catch {
    return err("Unauthorized", 401);
  }

  if (event.httpMethod !== "PATCH" && event.httpMethod !== "PUT") {
    return err("Method not allowed", 405);
  }

  const id = event.queryStringParameters?.id;
  if (!id) return err("Missing id", 400);

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return err("Invalid JSON");
  }

  const { status, stripeSubscriptionId } = body;

  if (status === "cancelled" && stripeSubscriptionId) {
    try {
      const result = await stripeRequest(`/subscriptions/${stripeSubscriptionId}`, "DELETE");
      return json({ success: true, status: "cancelled", stripeStatus: result.status });
    } catch (e) {
      console.error("cancel subscription error:", e.message);
      return err(e.message, 500);
    }
  }

  return json({ success: true, id, status: status || "updated" });
};
