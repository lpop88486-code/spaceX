import { Router } from "express";
import { db } from "@workspace/db";
import { walletsTable, walletTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getPaystackKey(): string | null {
  const key = process.env.PAYSTACK_SECRET_KEY || process.env.SLACK_TEST_API_KEY;
  if (!key || key.startsWith("sk_test_placeholder")) return null;
  return key;
}

async function getOrCreateWallet(email: string) {
  const existing = await db.select().from(walletsTable).where(eq(walletsTable.email, email.toLowerCase())).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db.insert(walletsTable).values({ email: email.toLowerCase(), balance: 0 }).returning();
  return created;
}

router.post("/paystack-init", async (req, res): Promise<void> => {
  const key = getPaystackKey();
  if (!key) {
    res.status(503).json({ error: "Paystack not configured. Add PAYSTACK_SECRET_KEY to environment variables." });
    return;
  }

  const { email, amount, tokens, label, callbackUrl } = req.body as {
    email: string;
    amount: number;
    tokens: number;
    label?: string;
    callbackUrl: string;
  };

  if (!email || !amount || !tokens || !callbackUrl) {
    res.status(400).json({ error: "Missing required fields: email, amount, tokens, callbackUrl" });
    return;
  }

  try {
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
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

    const data = await paystackRes.json() as { status: boolean; message?: string; data?: { authorization_url: string; access_code: string; reference: string } };
    if (!data.status) {
      res.status(400).json({ error: data.message || "Paystack initialization failed" });
      return;
    }

    res.json({
      authorizationUrl: data.data!.authorization_url,
      accessCode: data.data!.access_code,
      reference: data.data!.reference,
    });
  } catch (err) {
    req.log.error({ err }, "Paystack init error");
    res.status(500).json({ error: "Paystack initialization error" });
  }
});

router.get("/paystack-verify", async (req, res): Promise<void> => {
  const key = getPaystackKey();
  if (!key) {
    res.status(503).json({ error: "Paystack not configured" });
    return;
  }

  const ref = req.query.ref as string;
  if (!ref) {
    res.status(400).json({ error: "Missing ref parameter" });
    return;
  }

  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    const data = await paystackRes.json() as {
      status: boolean;
      message?: string;
      data?: {
        status: string;
        metadata?: { tokens?: number };
        amount: number;
        customer?: { email?: string };
        currency?: string;
        paid_at?: string;
      };
    };

    if (!data.status || data.data?.status !== "success") {
      res.json({ verified: false, message: data.message || "Transaction not successful" });
      return;
    }

    const txData = data.data!;
    const tokens = txData.metadata?.tokens || 0;
    const amountUsd = txData.amount / 100;

    res.json({
      verified: true,
      tokens,
      amount: amountUsd,
      reference: ref,
      email: txData.customer?.email,
      currency: txData.currency,
      paidAt: txData.paid_at,
    });
  } catch (err) {
    req.log.error({ err }, "Paystack verify error");
    res.status(500).json({ error: "Verification error" });
  }
});

// Paystack webhook — auto-credit wallet on successful payment
router.post("/paystack-webhook", async (req, res): Promise<void> => {
  const key = getPaystackKey();

  // Verify webhook signature
  if (key) {
    const { createHmac } = await import("node:crypto");
    const hash = createHmac("sha512", key).update(JSON.stringify(req.body)).digest("hex");
    if (hash !== req.headers["x-paystack-signature"]) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }
  }

  const { event, data } = req.body as {
    event: string;
    data: {
      reference: string;
      status: string;
      amount: number;
      customer?: { email?: string };
      metadata?: { tokens?: number; bundle_label?: string };
    };
  };

  if (event === "charge.success" && data.status === "success") {
    const email = data.customer?.email;
    const tokens = data.metadata?.tokens || 0;
    const label = data.metadata?.bundle_label || "Token Bundle";

    if (email && tokens > 0) {
      try {
        const wallet = await getOrCreateWallet(email);

        // Check if already processed (idempotency)
        const already = await db
          .select()
          .from(walletTransactionsTable)
          .where(eq(walletTransactionsTable.reference, data.reference))
          .limit(1);

        if (!already[0]) {
          await db
            .update(walletsTable)
            .set({ balance: wallet.balance + tokens, updatedAt: new Date() })
            .where(eq(walletsTable.id, wallet.id));

          await db.insert(walletTransactionsTable).values({
            walletId: wallet.id,
            type: "credit",
            amount: tokens,
            description: `Token top-up via Paystack — ${label}`,
            reference: data.reference,
            status: "completed",
            metadata: { source: "paystack", amount_usd: data.amount / 100 },
          });
        }
      } catch (err) {
        req.log.error({ err }, "Failed to credit wallet from Paystack webhook");
      }
    }
  }

  res.json({ received: true });
});

export default router;
