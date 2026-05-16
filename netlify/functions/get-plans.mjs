import { json, cors } from "./_utils.mjs";
import { PLANS } from "./_plans.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();
  const active = PLANS.filter((p) => p.active);
  return json(active);
};
