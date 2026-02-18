import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
    sendDispatchConfirmationEmail,
    sendDeliveryConfirmationEmail,
} from "@/lib/email/service";

export async function POST(req: NextRequest) {
    try {
        const { firestoreId, status, sendEmail } = (await req.json()) as {
            firestoreId: string;
            status: string;
            sendEmail?: boolean;
        };

        if (!firestoreId || !status) {
            return NextResponse.json(
                { error: "Missing firestoreId or status" },
                { status: 400 }
            );
        }

        const docRef = adminDb.collection("orders").doc(firestoreId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        await docRef.update({
            status,
            updatedAt: new Date().toISOString(),
        });

        /* Optionally send email */
        if (sendEmail) {
            const data = doc.data() as Record<string, unknown>;
            const emailData = {
                customerName: String(data.customerName || "Customer"),
                customerEmail: String(data.customerEmail || ""),
                orderId: firestoreId,
                items: (data.items as Array<{ name: string; price: number; quantity: number }>) || [],
                amount: Number(data.amount) || 0,
                shippingAddress: data.shippingAddress as {
                    name: string;
                    email: string;
                    phone: string;
                    street: string;
                    city: string;
                    state: string;
                    zip: string;
                },
            };

            if (status === "dispatched") {
                await sendDispatchConfirmationEmail(emailData);
            } else if (status === "delivered") {
                await sendDeliveryConfirmationEmail(emailData);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Order status update error:", error);
        return NextResponse.json(
            { error: "Failed to update order status" },
            { status: 500 }
        );
    }
}
