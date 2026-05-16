import { createHmac } from "crypto";
import { json, err } from "./_utils.mjs";

export async function handler(event) {
  if (event.httpMethod !== "POST") return err("Method not allowed", 405);

  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  const sig = event.headers["x-paystack-signature"];

  if (secret && sig) {
    const hash = createHmac("sha512", secret).update(event.body).digest("hex");
    if (hash !== sig) return err("Invalid signature", 401);
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return err("Invalid payload");
  }

  if (payload.event === "charge.success") {
    const tx = payload.data;
    const tokens = tx.metadata?.tokens || 0;
    const email = tx.customer?.email;

    console.log(`[Paystack Webhook] charge.success — ${email} — ${tokens} tokens — $${tx.amount / 100} USD`);
  }

  return json({ received: true });
}
