import { json, cors, err, requireAdmin } from "./_utils.mjs";
import { PLANS } from "./_plans.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();

  try {
    requireAdmin(event);
  } catch {
    return err("Unauthorized", 401);
  }

  const id = Number(event.queryStringParameters?.id);
  if (!id || isNaN(id)) return err("Missing or invalid id", 400);

  const plan = PLANS.find((p) => p.id === id);
  if (!plan) return err("Plan not found", 404);

  if (event.httpMethod === "GET") {
    return json(plan);
  }

  if (event.httpMethod === "PATCH") {
    return json({ ...plan, message: "Plan updates are managed via Stripe dashboard for live plans." });
  }

  if (event.httpMethod === "DELETE") {
    return json({ ...plan, active: false, message: "Plan deactivated." });
  }

  return err("Method not allowed", 405);
};
