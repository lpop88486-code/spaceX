import { verifyStripeWebhook } from "./_utils.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const sig = event.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret || secret.startsWith("whsec_placeholder")) {
    console.warn("Stripe webhook not fully configured — skipping signature check");
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  let stripeEvent;
  try {
    stripeEvent = verifyStripeWebhook(event.body, sig, secret);
  } catch (e) {
    console.error("Webhook signature verification failed:", e.message);
    return { statusCode: 400, body: `Webhook Error: ${e.message}` };
  }

  console.log("Stripe event received:", stripeEvent.type);

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object;
      console.log("New order completed:", {
        sessionId: session.id,
        planName: session.metadata?.planName,
        customerEmail: session.customer_details?.email,
        amount: session.amount_total,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = stripeEvent.data.object;
      console.log("Subscription cancelled:", subscription.id);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = stripeEvent.data.object;
      console.log("Payment failed for:", invoice.customer_email);
      break;
    }
    default:
      console.log("Unhandled event type:", stripeEvent.type);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
