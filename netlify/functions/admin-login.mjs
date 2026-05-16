import { json, cors, err, signJWT } from "./_utils.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();
  if (event.httpMethod !== "POST") return err("Method not allowed", 405);

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return err("Invalid JSON");
  }

  const { password } = body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (password !== ADMIN_PASSWORD) {
    return err("Invalid credentials", 401);
  }

  const token = signJWT({ role: "admin" }, 86400);
  return json({ success: true, token });
};
