import nodemailer from "nodemailer";

/* ─── Shared Types ─── */
interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

/* ─── Shared transporter factory ─── */
function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error(
      `Missing env: ${[
        !process.env.GMAIL_USER && "GMAIL_USER",
        !process.env.GMAIL_APP_PASSWORD && "GMAIL_APP_PASSWORD",
      ]
        .filter(Boolean)
        .join(", ")}`
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

const FROM = '"Sareine" <sareinebeauty@gmail.com>';

/* ─── Shared email wrapper ─── */
function emailWrapper(headerSubtitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#fbf9f4;font-family:'Manrope',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf9f4;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(201,164,92,0.1);">
          <!-- Gold Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C9A45C 0%,#D4B46A 50%,#BAA05C 100%);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;font-family:'Georgia',serif;font-size:28px;font-weight:500;color:#ffffff;letter-spacing:0.06em;">SAREINE</h1>
              <p style="margin:8px 0 0;font-family:'Manrope',Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.85);letter-spacing:0.1em;text-transform:uppercase;">${headerSubtitle}</p>
            </td>
          </tr>
          ${body}
          <!-- Footer -->
          <tr>
            <td style="background:#2a2723;padding:24px;text-align:center;">
              <p style="margin:0;font-family:'Manrope',Helvetica,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.04em;">
                © ${new Date().getFullYear()} Sareine. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Items table helper ─── */
function buildItemsTable(items: OrderItem[], amount: number): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0ece4;font-size:14px;color:#2a2723;">${item.name}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0ece4;font-size:14px;color:#5e564d;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0ece4;font-size:14px;color:#2a2723;text-align:right;font-weight:600;">₹${item.price * item.quantity}</td>
      </tr>`
    )
    .join("");

  return `
  <tr><td style="padding:24px;">
    <h3 style="margin:0 0 16px;font-family:'Georgia',serif;font-size:16px;font-weight:500;color:#2a2723;">Order Summary</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ece4;border-radius:8px;overflow:hidden;">
      <tr style="background:#faf7f2;">
        <th style="padding:10px 16px;font-size:11px;font-weight:600;color:#5e564d;text-transform:uppercase;letter-spacing:0.08em;text-align:left;">Product</th>
        <th style="padding:10px 16px;font-size:11px;font-weight:600;color:#5e564d;text-transform:uppercase;letter-spacing:0.08em;text-align:center;">Qty</th>
        <th style="padding:10px 16px;font-size:11px;font-weight:600;color:#5e564d;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Price</th>
      </tr>
      ${rows}
      <tr style="background:#faf7f2;">
        <td colspan="2" style="padding:14px 16px;font-size:14px;font-weight:600;color:#2a2723;">Total</td>
        <td style="padding:14px 16px;font-family:'Georgia',serif;font-size:18px;font-weight:600;color:#2a2723;text-align:right;">₹${amount}</td>
      </tr>
    </table>
  </td></tr>`;
}

/* ─── Shipping address block helper ─── */
function buildShippingBlock(addr: ShippingAddress): string {
  return `
  <tr><td style="padding:0 24px 24px;">
    <h3 style="margin:0 0 12px;font-family:'Georgia',serif;font-size:16px;font-weight:500;color:#2a2723;">Shipping To</h3>
    <div style="background:#faf7f2;border:1px solid #f0ece4;border-radius:8px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#2a2723;line-height:1.7;">
        <strong>${addr.name}</strong><br>
        ${addr.street}<br>
        ${addr.city}, ${addr.state} ${addr.zip}<br>
        📞 ${addr.phone}
      </p>
    </div>
  </td></tr>`;
}

/* ─── Divider helper ─── */
function divider(): string {
  return `<tr><td style="padding:0 24px;"><hr style="border:none;height:1px;background:linear-gradient(90deg,transparent,#C9A45C,transparent);margin:0;"></td></tr>`;
}

/* ═══════════════════════════════════════════════
 *  1. ORDER CONFIRMATION EMAIL
 * ═══════════════════════════════════════════════ */
interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  razorpayPaymentId: string;
  items: OrderItem[];
  amount: number;
  shippingAddress: ShippingAddress;
}

export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = `
      <tr><td style="padding:32px 24px 16px;">
        <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;font-weight:500;color:#2a2723;">Thank you, ${data.customerName}!</h2>
        <p style="margin:0;font-size:14px;color:#5e564d;line-height:1.6;">Your payment has been confirmed. We are preparing your order with care.</p>
      </td></tr>
      ${divider()}
      ${buildItemsTable(data.items, data.amount)}
      ${buildShippingBlock(data.shippingAddress)}
      <tr><td style="padding:0 24px 32px;">
        <p style="margin:0;font-size:12px;color:#5e564d;">Payment ID: <strong style="color:#2a2723;">${data.razorpayPaymentId}</strong></p>
      </td></tr>`;

    const html = emailWrapper("Order Confirmation", body);
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: "Order Confirmed — Sareine",
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[EMAIL] Order confirmation failed:", message);
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════
 *  2. PREORDER CONFIRMATION EMAIL
 * ═══════════════════════════════════════════════ */
interface PreorderEmailData {
  customerName: string;
  customerEmail: string;
  preorderId: string;
  items: OrderItem[];
  amount: number;
  shippingAddress: ShippingAddress;
}

export async function sendPreorderConfirmationEmail(
  data: PreorderEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = `
      <tr><td style="padding:32px 24px 16px;">
        <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;font-weight:500;color:#2a2723;">Thank you, ${data.customerName}!</h2>
        <p style="margin:0;font-size:14px;color:#5e564d;line-height:1.6;">Your pre-order has been received. We'll reach out with a payment link when it's ready to ship.</p>
      </td></tr>
      <tr><td style="padding:0 24px 16px;">
        <div style="background:#faf7f2;border:1px solid #f0ece4;border-radius:8px;padding:12px 16px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#5e564d;text-transform:uppercase;letter-spacing:0.08em;">Pre-order ID</p>
          <p style="margin:4px 0 0;font-family:'Georgia',serif;font-size:18px;font-weight:600;color:#C9A45C;">${data.preorderId}</p>
        </div>
      </td></tr>
      ${divider()}
      ${buildItemsTable(data.items, data.amount)}
      ${buildShippingBlock(data.shippingAddress)}
      <tr><td style="padding:0 24px 32px;">
        <div style="background:#fffbeb;border:1px solid #f0ece4;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:13px;color:#5e564d;line-height:1.6;">
            💛 <strong>What happens next?</strong><br>
            We're preparing your order with love. You'll receive a payment link via email once manufacturing is complete (~10 days). No payment is needed now.
          </p>
        </div>
      </td></tr>`;

    const html = emailWrapper("Pre-order Confirmed", body);
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: `Pre-order Confirmed — ${data.preorderId} — Sareine`,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[EMAIL] Preorder confirmation failed:", message);
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════
 *  3. PAYMENT LINK EMAIL
 * ═══════════════════════════════════════════════ */
interface PaymentLinkEmailData {
  customerName: string;
  customerEmail: string;
  preorderId: string;
  amount: number;
  paymentLink: string;
}

export async function sendPaymentLinkEmail(
  data: PaymentLinkEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = `
      <tr><td style="padding:32px 24px 16px;">
        <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;font-weight:500;color:#2a2723;">Hi ${data.customerName},</h2>
        <p style="margin:0;font-size:14px;color:#5e564d;line-height:1.6;">
          Great news! Your pre-order <strong style="color:#C9A45C;">${data.preorderId}</strong> is ready. Please complete your payment to proceed with shipping.
        </p>
      </td></tr>
      <tr><td style="padding:0 24px 24px;">
        <div style="background:#faf7f2;border:1px solid #f0ece4;border-radius:8px;padding:20px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#5e564d;text-transform:uppercase;letter-spacing:0.08em;">Amount Due</p>
          <p style="margin:8px 0 0;font-family:'Georgia',serif;font-size:32px;font-weight:600;color:#2a2723;">₹${data.amount}</p>
        </div>
      </td></tr>
      <tr><td style="padding:0 24px 32px;text-align:center;">
        <a href="${data.paymentLink}" style="display:inline-block;background:linear-gradient(135deg,#C9A45C 0%,#D4B46A 50%,#BAA05C 100%);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.04em;">Pay Now</a>
        <p style="margin:12px 0 0;font-size:12px;color:#5e564d;">Or copy this link: <a href="${data.paymentLink}" style="color:#C9A45C;">${data.paymentLink}</a></p>
      </td></tr>`;

    const html = emailWrapper("Your Order is Ready", body);
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: `Complete Your Payment — ${data.preorderId} — Sareine`,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[EMAIL] Payment link email failed:", message);
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════
 *  4. DISPATCH CONFIRMATION EMAIL
 * ═══════════════════════════════════════════════ */
interface DispatchEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: OrderItem[];
  amount: number;
  shippingAddress: ShippingAddress;
}

export async function sendDispatchConfirmationEmail(
  data: DispatchEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = `
      <tr><td style="padding:32px 24px 16px;">
        <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;font-weight:500;color:#2a2723;">Your order has been shipped! 🚚</h2>
        <p style="margin:0;font-size:14px;color:#5e564d;line-height:1.6;">
          Hi ${data.customerName}, your order <strong style="color:#C9A45C;">${data.orderId}</strong> is on its way to you.
        </p>
      </td></tr>
      ${divider()}
      ${buildItemsTable(data.items, data.amount)}
      ${buildShippingBlock(data.shippingAddress)}
      <tr><td style="padding:0 24px 32px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
            📦 Your package has been dispatched and should arrive within 5-7 business days. We'll notify you upon delivery.
          </p>
        </div>
      </td></tr>`;

    const html = emailWrapper("Order Shipped", body);
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: `Your Order Has Been Shipped — Sareine`,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[EMAIL] Dispatch confirmation failed:", message);
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════
 *  5. DELIVERY CONFIRMATION EMAIL
 * ═══════════════════════════════════════════════ */
export async function sendDeliveryConfirmationEmail(
  data: DispatchEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = `
      <tr><td style="padding:32px 24px 16px;">
        <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;font-weight:500;color:#2a2723;">Your order has been delivered! 🎉</h2>
        <p style="margin:0;font-size:14px;color:#5e564d;line-height:1.6;">
          Hi ${data.customerName}, your order <strong style="color:#C9A45C;">${data.orderId}</strong> has been successfully delivered.
        </p>
      </td></tr>
      ${divider()}
      ${buildItemsTable(data.items, data.amount)}
      <tr><td style="padding:0 24px 32px;">
        <div style="background:#fffbeb;border:1px solid #fef08a;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:13px;color:#854d0e;line-height:1.6;">
            💛 We hope you love your Sareine products! If you have any questions or feedback, please don't hesitate to reach out.
          </p>
        </div>
      </td></tr>`;

    const html = emailWrapper("Order Delivered", body);
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: `Your Order Has Been Delivered — Sareine`,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[EMAIL] Delivery confirmation failed:", message);
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════
 *  6. PROMOTIONAL / ANNOUNCEMENT EMAIL
 * ═══════════════════════════════════════════════ */
interface PromoEmailData {
  customerName: string;
  customerEmail: string;
  subject: string;
  heading: string;
  bodyText: string;
  ctaText?: string;
  ctaUrl?: string;
}

export async function sendPromotionalEmail(
  data: PromoEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctaBlock = data.ctaText && data.ctaUrl
      ? `<tr><td style="padding:0 24px 32px;text-align:center;">
           <a href="${data.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A45C 0%,#D4B46A 50%,#BAA05C 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.04em;">${data.ctaText}</a>
         </td></tr>`
      : "";

    const body = `
      <tr><td style="padding:32px 24px 16px;">
        <h2 style="margin:0 0 12px;font-family:'Georgia',serif;font-size:22px;font-weight:500;color:#2a2723;">${data.heading}</h2>
        <p style="margin:0;font-size:14px;color:#5e564d;line-height:1.7;white-space:pre-line;">${data.bodyText}</p>
      </td></tr>
      ${ctaBlock}`;

    const html = emailWrapper("From Sareine", body);
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: data.subject,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[EMAIL] Promotional email failed:", message);
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════
 *  7. WELCOME EMAIL
 * ═══════════════════════════════════════════════ */
interface WelcomeEmailData {
  customerName: string;
  customerEmail: string;
}

export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = `
      <tr><td style="padding:32px 24px 16px;">
        <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;font-weight:500;color:#2a2723;">Welcome to Sareine, ${data.customerName}!</h2>
        <p style="margin:0;font-size:14px;color:#5e564d;line-height:1.7;">
          We're delighted to have you join the Sareine family. Our luxury lip balms are crafted with exotic botanicals — Damask Rose, Himalayan Hibiscus, Night-Blooming Jasmine, and Orchid extracts — for effortlessly soft, nourished lips.
        </p>
      </td></tr>
      ${divider()}
      <tr><td style="padding:24px;">
        <div style="background:#faf7f2;border:1px solid #f0ece4;border-radius:8px;padding:20px;">
          <h3 style="margin:0 0 12px;font-family:'Georgia',serif;font-size:16px;font-weight:500;color:#2a2723;">What to Expect</h3>
          <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#5e564d;line-height:2;">
            <li>Exclusive access to limited edition collections</li>
            <li>Early notifications on new launches</li>
            <li>Special offers crafted just for you</li>
          </ul>
        </div>
      </td></tr>
      <tr><td style="padding:0 24px 32px;text-align:center;">
        <a href="https://sareine.in" style="display:inline-block;background:linear-gradient(135deg,#C9A45C 0%,#D4B46A 50%,#BAA05C 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.04em;">Explore Sareine</a>
      </td></tr>`;

    const html = emailWrapper("Welcome", body);
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: "Welcome to Sareine 💛",
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[EMAIL] Welcome email failed:", message);
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════
 *  CUSTOM EMAIL (for admin quick actions)
 * ═══════════════════════════════════════════════ */
interface CustomEmailData {
  recipientEmail: string;
  subject: string;
  heading: string;
  bodyText: string;
}

export async function sendCustomEmail(
  data: CustomEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = `
      <tr><td style="padding:32px 24px;">
        <h2 style="margin:0 0 12px;font-family:'Georgia',serif;font-size:22px;font-weight:500;color:#2a2723;">${data.heading}</h2>
        <p style="margin:0;font-size:14px;color:#5e564d;line-height:1.7;white-space:pre-line;">${data.bodyText}</p>
      </td></tr>`;

    const html = emailWrapper("Sareine", body);
    const transporter = createTransporter();
    await transporter.sendMail({
      from: FROM,
      to: data.recipientEmail,
      subject: data.subject,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[EMAIL] Custom email failed:", message);
    return { success: false, error: message };
  }
}
