import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
    try {
        const snap = await adminDb
            .collection("email_logs")
            .orderBy("sentAt", "desc")
            .limit(100)
            .get();

        const logs = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ logs });
    } catch (error) {
        console.error("Email log error:", error);
        return NextResponse.json(
            { error: "Failed to fetch email logs" },
            { status: 500 }
        );
    }
}
