import { createHmac } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "spacex-starlink-jwt-secret";

export function signJWT(payload, expiresInSecs = 86400) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSecs })
  ).toString("base64url");
  const sig = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJWT(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error("Token expired");
  return payload;
}

export function requireAdmin(event) {
  const auth =
    event.headers?.authorization || event.headers?.Authorization || "";
  if (!auth.startsWith("Bearer ")) throw new Error("Unauthorized");
  return verifyJWT(auth.slice(7));
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

export function json(data, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify(data),
  };
}

export function cors() {
  return { statusCode: 204, headers: CORS, body: "" };
}

export function err(message, status = 400) {
  return json({ error: message }, status);
}

function flattenParams(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (item !== null && typeof item === "object") {
          Object.assign(result, flattenParams(item, `${fullKey}[${idx}]`));
        } else {
          result[`${fullKey}[${idx}]`] = String(item);
        }
      });
    } else if (typeof value === "object") {
      Object.assign(result, flattenParams(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

export async function stripeRequest(path, method = "GET", params = null) {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key || key.startsWith("sk_test_placeholder")) {
    throw new Error("Stripe not configured. Please set STRIPE_SECRET_KEY in Netlify environment variables.");
  }
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  let url = `https://api.stripe.com/v1${path}`;
  if (params && method === "GET") {
    url += "?" + new URLSearchParams(flattenParams(params)).toString();
  } else if (params) {
    options.body = new URLSearchParams(flattenParams(params)).toString();
  }
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Stripe API error");
  return data;
}

export function verifyStripeWebhook(rawBody, sigHeader, secret) {
  const parts = sigHeader.split(",");
  const tsPart = parts.find((p) => p.startsWith("t="));
  const v1Part = parts.find((p) => p.startsWith("v1="));
  if (!tsPart || !v1Part) throw new Error("Invalid Stripe signature header");
  const ts = tsPart.split("=")[1];
  const v1 = v1Part.split("=")[1];
  const computed = createHmac("sha256", secret)
    .update(`${ts}.${rawBody}`)
    .digest("hex");
  if (computed !== v1) throw new Error("Webhook signature mismatch");
  return JSON.parse(rawBody);
}
