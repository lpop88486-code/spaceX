import { Router } from "express";
import { db } from "@workspace/db";
import { plansTable, subscriptionsTable, walletsTable, walletTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendSubscriptionConfirmation } from "../lib/email";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" });
}

// ── Wallet Pay: debit wallet tokens and create subscription directly ──────────
router.post("/checkout/wallet-pay", async (req, res): Promise<void> => {
  try {
    const { planId, email, name, address } = req.body as {
      planId: number;
      email: string;
      name: string;
      address?: string;
    };

    if (!planId || !email || !name) {
      res.status(400).json({ error: "planId, email, and name are required" });
      return;
    }

    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId));
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const priceTokens = Math.ceil(parseFloat(plan.priceMonthly));

    // Get or create wallet
    const existing = await db.select().from(walletsTable).where(eq(walletsTable.email, email.toLowerCase())).limit(1);
    let wallet = existing[0];
    if (!wallet) {
      const [created] = await db.insert(walletsTable).values({ email: email.toLowerCase(), balance: 0 }).returning();
      wallet = created;
    }

    if (wallet.balance < priceTokens) {
      res.status(402).json({
        error: "Insufficient wallet balance",
        required: priceTokens,
        available: wallet.balance,
      });
      return;
    }

    // Debit wallet
    const [updatedWallet] = await db
      .update(walletsTable)
      .set({ balance: wallet.balance - priceTokens, updatedAt: new Date() })
      .where(eq(walletsTable.id, wallet.id))
      .returning();

    // Record transaction
    await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      type: "debit",
      amount: priceTokens,
      description: `Subscription: ${plan.name} — 1 month`,
      reference: `SUB-${Date.now()}`,
      status: "completed",
      metadata: { planId, planName: plan.name },
    });

    // Create active subscription
    const [sub] = await db
      .insert(subscriptionsTable)
      .values({
        email: email.toLowerCase(),
        name,
        planId,
        address: address ?? null,
        status: "active",
        stripeSessionId: `wallet_${Date.now()}`,
      })
      .returning();

    // Send confirmation email (non-blocking)
    sendSubscriptionConfirmation({
      customerName: sub.name,
      customerEmail: sub.email,
      planName: plan.name,
      planCategory: plan.category,
      planSpeed: plan.speed,
      priceMonthly: parseFloat(plan.priceMonthly),
      features: plan.features as string[],
      subscriptionId: sub.id,
    }).catch(() => {});

    res.json({
      success: true,
      subscription: {
        id: sub.id,
        email: sub.email,
        name: sub.name,
        planId: sub.planId,
        planName: plan.name,
        planCategory: plan.category,
        priceMonthly: parseFloat(plan.priceMonthly),
        status: sub.status,
        createdAt: sub.createdAt,
      },
      wallet: {
        balance: updatedWallet.balance,
        tokensUsed: priceTokens,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process wallet payment");
    res.status(500).json({ error: "Failed to process wallet payment" });
  }
});

router.post("/checkout/session", async (req, res): Promise<void> => {
  try {
    const { planId, email, name, address, successUrl, cancelUrl } = req.body;

    if (!planId || !email || !name) {
      res.status(400).json({ error: "planId, email, and name are required" });
      return;
    }

    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId));
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const stripe = getStripe();
    const baseUrl =
      process.env.APP_URL ??
      `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;

    if (!stripe) {
      const [sub] = await db
        .insert(subscriptionsTable)
        .values({
          email,
          name,
          planId,
          address,
          status: "active",
          stripeSessionId: `mock_${Date.now()}`,
        })
        .returning();

      res.json({
        sessionId: `mock_${sub.id}`,
        url: `${baseUrl}/checkout/success?session_id=mock_${sub.id}`,
      });
      return;
    }

    const lineItems: {
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
        recurring?: { interval: string };
      };
      quantity: number;
    }[] = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `SpaceXStarlink — ${plan.name}`,
            description: plan.description,
          },
          unit_amount: Math.round(parseFloat(plan.priceMonthly) * 100),
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ];

    if (plan.hardwarePrice) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "SpaceXStarlink Hardware Kit" },
          unit_amount: Math.round(parseFloat(plan.hardwarePrice) * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: lineItems,
      success_url:
        successUrl ??
        `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${baseUrl}/plans`,
      metadata: { planId: String(planId), name, address: address ?? "" },
    });

    await db.insert(subscriptionsTable).values({
      email,
      name,
      planId,
      address,
      status: "incomplete",
      stripeSessionId: session.id,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/checkout/success", async (req, res): Promise<void> => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      res.json({ success: false });
      return;
    }

    const stripe = getStripe();

    if (!stripe) {
      const subIdStr = sessionId.replace("mock_", "");
      const subId = parseInt(subIdStr, 10);
      if (!isNaN(subId)) {
        const [existing] = await db
          .select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.id, subId));
        if (existing) {
          const [plan] = await db
            .select()
            .from(plansTable)
            .where(eq(plansTable.id, existing.planId));
          if (plan) {
            sendSubscriptionConfirmation({
              customerName: existing.name,
              customerEmail: existing.email,
              planName: plan.name,
              planCategory: plan.category,
              planSpeed: plan.speed,
              priceMonthly: parseFloat(plan.priceMonthly),
              features: plan.features as string[],
              subscriptionId: existing.id,
            }).catch(() => {});
          }
          res.json({
            success: true,
            subscription: {
              id: existing.id,
              email: existing.email,
              name: existing.name,
              planId: existing.planId,
              planName: plan?.name ?? "",
              planCategory: plan?.category ?? "",
              priceMonthly: plan ? parseFloat(plan.priceMonthly) : 0,
              status: existing.status,
              createdAt: existing.createdAt,
            },
          });
          return;
        }
      }
      res.json({ success: true });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      res.json({ success: false });
      return;
    }

    const planId = parseInt(session.metadata?.planId ?? "0", 10);
    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId));

    const [existing] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.stripeSessionId, sessionId));

    let sub: typeof subscriptionsTable.$inferSelect;
    if (existing) {
      const [updated] = await db
        .update(subscriptionsTable)
        .set({
          status: "active",
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
        })
        .where(eq(subscriptionsTable.stripeSessionId, sessionId))
        .returning();
      sub = updated;
    } else {
      const [created] = await db
        .insert(subscriptionsTable)
        .values({
          email: session.customer_details?.email ?? "",
          name: session.metadata?.name ?? "",
          planId,
          address: session.metadata?.address ?? "",
          status: "active",
          stripeSessionId: sessionId,
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
        })
        .returning();
      sub = created;
    }

    if (plan) {
      sendSubscriptionConfirmation({
        customerName: sub.name,
        customerEmail: sub.email,
        planName: plan.name,
        planCategory: plan.category,
        planSpeed: plan.speed,
        priceMonthly: parseFloat(plan.priceMonthly),
        features: plan.features as string[],
        subscriptionId: sub.id,
      }).catch(() => {});
    }

    res.json({
      success: true,
      subscription: {
        id: sub.id,
        email: sub.email,
        name: sub.name,
        planId: sub.planId,
        planName: plan?.name ?? "",
        planCategory: plan?.category ?? "",
        priceMonthly: plan ? parseFloat(plan.priceMonthly) : 0,
        status: sub.status,
        createdAt: sub.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to confirm checkout");
    res.status(500).json({ error: "Failed to confirm checkout" });
  }
});

router.post("/checkout/webhook", async (req, res): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.json({ received: true });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body as typeof event;
    }
  } catch {
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as { id: string; subscription: string; customer: string };
        await db
          .update(subscriptionsTable)
          .set({
            status: "active",
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
          })
          .where(eq(subscriptionsTable.stripeSessionId, session.id));
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as { id: string };
        await db
          .update(subscriptionsTable)
          .set({ status: "cancelled", cancelledAt: new Date() })
          .where(eq(subscriptionsTable.stripeSubscriptionId, subscription.id));
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as { subscription?: string };
        if (invoice.subscription) {
          await db
            .update(subscriptionsTable)
            .set({ status: "past_due" })
            .where(eq(subscriptionsTable.stripeSubscriptionId, invoice.subscription));
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Webhook handler error");
    res.status(500).json({ error: "Webhook handler error" });
  }
});

export default router;
