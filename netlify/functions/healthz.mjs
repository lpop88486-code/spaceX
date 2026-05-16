import { json, cors } from "./_utils.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();
  return json({ status: "ok" });
};
