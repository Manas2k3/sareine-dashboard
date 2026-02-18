import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
    try {
        const { amount, customerName, customerEmail, phone, preorderId } = await req.json();

        if (!process.env.RZP_TEST_KEY_ID || !process.env.RZP_KEY_SECRET) {
            console.error("Razorpay keys missing");
            return NextResponse.json(
                { error: "Razorpay configuration missing" },
                { status: 500 }
            );
        }

        const instance = new Razorpay({
            key_id: process.env.RZP_TEST_KEY_ID,
            key_secret: process.env.RZP_KEY_SECRET,
        });

        // Amount in paise
        const amountInPaise = Math.round(parseFloat(amount) * 100);

        const options = {
            amount: amountInPaise,
            currency: "INR",
            accept_partial: false,
            description: `Payment for Preorder #${preorderId}`,
            customer: {
                name: customerName,
                email: customerEmail,
                contact: phone,
            },
            notify: {
                sms: true,
                email: true,
            },
            reminder_enable: true,
            notes: {
                preorderId: preorderId,
            },
            // callback_url: "https://sareine.com/payment-success", // Optional: Redirect after payment
            // callback_method: "get"
        };

        const paymentLink = await instance.paymentLink.create(options);

        return NextResponse.json({
            id: paymentLink.id,
            short_url: paymentLink.short_url,
            status: paymentLink.status,
        });

    } catch (error) {
        console.error("Error creating payment link:", error);
        return NextResponse.json(
            { error: "Failed to create payment link" },
            { status: 500 }
        );
    }
}
