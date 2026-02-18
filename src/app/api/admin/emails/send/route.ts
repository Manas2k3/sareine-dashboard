import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
    sendOrderConfirmationEmail,
    sendPreorderConfirmationEmail,
    sendPaymentLinkEmail,
    sendDispatchConfirmationEmail,
    sendDeliveryConfirmationEmail,
    sendPromotionalEmail,
    sendCustomEmail,
    sendWelcomeEmail,
} from "@/lib/email/service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type } = body as { type: string };

        let result: { success: boolean; error?: string };

        switch (type) {
            case "order_confirmation": {
                const { firestoreId } = body;
                const doc = await adminDb.collection("orders").doc(firestoreId).get();
                if (!doc.exists)
                    return NextResponse.json({ error: "Order not found" }, { status: 404 });
                const data = doc.data()!;
                result = await sendOrderConfirmationEmail({
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    razorpayPaymentId: data.razorpayPaymentId || "N/A",
                    items: data.items || [],
                    amount: data.amount,
                    shippingAddress: data.shippingAddress,
                });
                break;
            }

            case "preorder_confirmation": {
                const { firestoreId } = body;
                const doc = await adminDb.collection("preorders").doc(firestoreId).get();
                if (!doc.exists)
                    return NextResponse.json({ error: "Preorder not found" }, { status: 404 });
                const data = doc.data()!;
                result = await sendPreorderConfirmationEmail({
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    preorderId: data.preorderId,
                    items: data.items || [],
                    amount: data.amount,
                    shippingAddress: data.shippingAddress,
                });
                break;
            }

            case "payment_link": {
                console.log("[API] Sending payment link email for:", body.preorderId);
                const { customerName, customerEmail, preorderId, amount, paymentLink } = body;
                result = await sendPaymentLinkEmail({
                    customerName,
                    customerEmail,
                    preorderId,
                    amount,
                    paymentLink,
                });
                console.log("[API] Payment link email result:", result);
                break;
            }

            case "dispatch": {
                const { firestoreId } = body;
                const doc = await adminDb.collection("orders").doc(firestoreId).get();
                if (!doc.exists)
                    return NextResponse.json({ error: "Order not found" }, { status: 404 });
                const data = doc.data()!;
                result = await sendDispatchConfirmationEmail({
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    orderId: firestoreId,
                    items: data.items || [],
                    amount: data.amount,
                    shippingAddress: data.shippingAddress,
                });
                break;
            }

            case "delivery": {
                const { firestoreId } = body;
                const doc = await adminDb.collection("orders").doc(firestoreId).get();
                if (!doc.exists)
                    return NextResponse.json({ error: "Order not found" }, { status: 404 });
                const data = doc.data()!;
                result = await sendDeliveryConfirmationEmail({
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    orderId: firestoreId,
                    items: data.items || [],
                    amount: data.amount,
                    shippingAddress: data.shippingAddress,
                });
                break;
            }

            case "promotional": {
                const { recipients, subject, heading, bodyText, ctaText, ctaUrl } = body;
                const emails: string[] = recipients || [];
                if (!emails.length) {
                    /* Bulk to all customers */
                    const usersSnap = await adminDb.collection("users").get();
                    usersSnap.docs.forEach((doc) => {
                        const email = doc.data().email;
                        if (email) emails.push(email);
                    });
                }

                let successCount = 0;
                for (const email of emails) {
                    const r = await sendPromotionalEmail({
                        customerName: "Valued Customer",
                        customerEmail: email,
                        subject: subject || "News from Sareine",
                        heading: heading || "Hello from Sareine",
                        bodyText: bodyText || "",
                        ctaText,
                        ctaUrl,
                    });
                    if (r.success) successCount++;
                }

                result = {
                    success: true,
                    error: `Sent to ${successCount}/${emails.length} recipients`,
                };
                break;
            }

            case "welcome": {
                const { customerName, customerEmail } = body;
                result = await sendWelcomeEmail({ customerName, customerEmail });
                break;
            }

            case "custom": {
                const { recipientEmail, subject, heading, bodyText } = body;
                result = await sendCustomEmail({
                    recipientEmail,
                    subject,
                    heading,
                    bodyText,
                });
                break;
            }

            default:
                return NextResponse.json(
                    { error: `Unknown email type: ${type}` },
                    { status: 400 }
                );
        }

        /* Log the email */
        try {
            await adminDb.collection("email_logs").add({
                type,
                recipient: body.customerEmail || body.recipientEmail || "bulk",
                subject: body.subject || type,
                success: result.success,
                error: result.error,
                sentAt: new Date().toISOString(),
            });
        } catch {
            /* Non-critical: don't fail the request if logging fails */
        }

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: result.error });
    } catch (error) {
        console.error("Email send error:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
