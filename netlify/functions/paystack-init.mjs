import { json, err, cors } from "./_utils.mjs";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return cors();
  if (event.httpMethod !== "POST") return err("Method not allowed", 405);

  const key = process.env.PAYSTACK_SECRET_KEY || "";
  if (!key || key.startsWith("sk_test_placeholder")) {
    return err("Paystack not configured. Add PAYSTACK_SECRET_KEY to Netlify environment variables.", 503);
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return err("Invalid request body");
  }

  const { email, amount, tokens, label, callbackUrl } = body;
  if (!email || !amount || !tokens || !callbackUrl) {
    return err("Missing required fields: email, amount, tokens, callbackUrl");
  }

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount),
        currency: "USD",
        callback_url: callbackUrl,
        metadata: {
          tokens,
          bundle_label: label || "Token Bundle",
          custom_fields: [
            { display_name: "Token Bundle", variable_name: "bundle", value: `${tokens} Tokens` },
          ],
        },
        channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
      }),
    });

    const data = await res.json();
    if (!data.status) {
      return err(data.message || "Paystack initialization failed");
    }

    return json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (e) {
    return err(`Paystack error: ${e.message}`, 500);
  }
}
