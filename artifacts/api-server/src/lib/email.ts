import { logger } from "./logger";

interface SubscriptionConfirmationData {
  customerName: string;
  customerEmail: string;
  planName: string;
  planCategory: string;
  planSpeed: string;
  priceMonthly: number;
  features: string[];
  subscriptionId: number;
}

interface CancellationData {
  customerName: string;
  customerEmail: string;
  planName: string;
  priceMonthly: number;
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require("resend");
  return new Resend(key);
}

const FROM_EMAIL = process.env.EMAIL_FROM ?? "SpaceXStarlink <noreply@spacexstarlink.com>";

function confirmationHtml(data: SubscriptionConfirmationData): string {
  const featuresHtml = data.features
    .map(
      (f) =>
        `<tr><td style="padding:6px 0;color:#a0aec0;font-size:14px;">
          <span style="color:#00D4FF;margin-right:8px;">✦</span>${f}
        </td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to SpaceXStarlink</title>
</head>
<body style="margin:0;padding:0;background:#050D1A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050D1A;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:20px;font-weight:800;letter-spacing:2px;color:#ffffff;">
                  SPACEX<span style="color:#00D4FF;">STARLINK</span>
                </span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:linear-gradient(135deg,#0a1628 0%,#0d1f3c 100%);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:40px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:3px;color:#00D4FF;text-transform:uppercase;">Subscription Confirmed</p>
          <h1 style="margin:0 0 16px;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">You're connected<br/>to the future.</h1>
          <p style="margin:0;font-size:16px;color:#a0aec0;line-height:1.6;">
            Welcome, ${data.customerName}. Your <strong style="color:#ffffff;">${data.planName}</strong> subscription is now active.
            You're joining a global constellation of satellite internet users.
          </p>
        </td></tr>

        <!-- Plan Details -->
        <tr><td style="padding-top:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:28px;">
            <tr>
              <td style="padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#00D4FF;text-transform:uppercase;">Your Plan</p>
                <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">${data.planName}</p>
                <p style="margin:4px 0 0;font-size:14px;color:#a0aec0;text-transform:capitalize;">${data.planCategory} · ${data.planSpeed}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#00D4FF;text-transform:uppercase;">Monthly Rate</p>
                <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;">$${data.priceMonthly}<span style="font-size:16px;color:#a0aec0;font-weight:400;">/mo</span></p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;color:#00D4FF;text-transform:uppercase;">Key Features</p>
                <table width="100%" cellpadding="0" cellspacing="0">${featuresHtml}</table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Next Steps -->
        <tr><td style="padding-top:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:28px;">
            <tr><td style="padding-bottom:16px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#00D4FF;text-transform:uppercase;">Next Steps</p>
            </td></tr>
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;">
                    <span style="display:inline-block;background:rgba(0,212,255,0.1);color:#00D4FF;font-size:12px;font-weight:700;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;margin-right:12px;">1</span>
                    <span style="font-size:14px;color:#e2e8f0;">Your hardware kit will be shipped within 3–5 business days</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="display:inline-block;background:rgba(0,212,255,0.1);color:#00D4FF;font-size:12px;font-weight:700;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;margin-right:12px;">2</span>
                    <span style="font-size:14px;color:#e2e8f0;">Follow the plug & play setup instructions included in your kit</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="display:inline-block;background:rgba(0,212,255,0.1);color:#00D4FF;font-size:12px;font-weight:700;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;margin-right:12px;">3</span>
                    <span style="font-size:14px;color:#e2e8f0;">You're online — enjoy high-speed satellite internet anywhere</span>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Subscription ID -->
        <tr><td style="padding-top:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.15);border-radius:8px;padding:16px 20px;">
            <tr>
              <td>
                <p style="margin:0;font-size:12px;color:#a0aec0;">
                  Subscription ID: <span style="color:#00D4FF;font-family:monospace;">#SXS-${String(data.subscriptionId).padStart(6, "0")}</span>
                  &nbsp;&nbsp;·&nbsp;&nbsp; Keep this for your records
                </p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;color:#4a5568;">Questions? Contact us at support@spacexstarlink.com</p>
          <p style="margin:0;font-size:12px;color:#2d3748;">© 2026 SpaceXStarlink · High-Speed Satellite Internet</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function cancellationHtml(data: CancellationData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Subscription Cancelled</title></head>
<body style="margin:0;padding:0;background:#050D1A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050D1A;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:32px;">
          <span style="font-size:20px;font-weight:800;letter-spacing:2px;color:#ffffff;">
            SPACEX<span style="color:#00D4FF;">STARLINK</span>
          </span>
        </td></tr>
        <tr><td style="background:#0a1628;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:40px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:3px;color:#a0aec0;text-transform:uppercase;">Subscription Cancelled</p>
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:#ffffff;">We're sorry to see you go</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#a0aec0;line-height:1.6;">
            Hi ${data.customerName}, your <strong style="color:#ffffff;">${data.planName}</strong> subscription ($${data.priceMonthly}/mo) has been cancelled successfully.
            You'll retain access until the end of your current billing period.
          </p>
          <p style="margin:0;font-size:14px;color:#a0aec0;">
            If you cancelled by mistake or want to reactivate, visit our website or contact support at
            <a href="mailto:support@spacexstarlink.com" style="color:#00D4FF;">support@spacexstarlink.com</a>.
          </p>
        </td></tr>
        <tr><td style="padding-top:32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#2d3748;">© 2026 SpaceXStarlink · High-Speed Satellite Internet</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendSubscriptionConfirmation(data: SubscriptionConfirmationData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.info({ email: data.customerEmail }, "Email skipped — RESEND_API_KEY not configured");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Welcome to SpaceXStarlink — Your ${data.planName} is Active`,
      html: confirmationHtml(data),
    });
    logger.info({ email: data.customerEmail, planName: data.planName }, "Subscription confirmation email sent");
  } catch (err) {
    logger.error({ err, email: data.customerEmail }, "Failed to send confirmation email");
  }
}

export async function sendCancellationEmail(data: CancellationData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.info({ email: data.customerEmail }, "Email skipped — RESEND_API_KEY not configured");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your SpaceXStarlink Subscription Has Been Cancelled`,
      html: cancellationHtml(data),
    });
    logger.info({ email: data.customerEmail }, "Cancellation email sent");
  } catch (err) {
    logger.error({ err, email: data.customerEmail }, "Failed to send cancellation email");
  }
}
