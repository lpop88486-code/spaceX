import { json, cors, err, requireAdmin } from "./_utils.mjs";
import { PLANS } from "./_plans.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();

  try {
    requireAdmin(event);
  } catch {
    return err("Unauthorized", 401);
  }

  if (event.httpMethod === "GET") {
    return json(PLANS);
  }

  return err("Method not allowed", 405);
};
