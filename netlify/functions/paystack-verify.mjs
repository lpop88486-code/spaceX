import { json, err, cors } from "./_utils.mjs";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return cors();
  if (event.httpMethod !== "GET") return err("Method not allowed", 405);

  const key = process.env.PAYSTACK_SECRET_KEY || "";
  if (!key || key.startsWith("sk_test_placeholder")) {
    return err("Paystack not configured", 503);
  }

  const ref = event.queryStringParameters?.ref;
  if (!ref) return err("Missing ref parameter");

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    const data = await res.json();
    if (!data.status || data.data?.status !== "success") {
      return json({ verified: false, message: data.message || "Transaction not successful" });
    }

    const txData = data.data;
    const tokens = txData.metadata?.tokens || 0;
    const amountUsd = txData.amount / 100;

    return json({
      verified: true,
      tokens,
      amount: amountUsd,
      reference: ref,
      email: txData.customer?.email,
      currency: txData.currency,
      paidAt: txData.paid_at,
    });
  } catch (e) {
    return err(`Verification error: ${e.message}`, 500);
  }
}
