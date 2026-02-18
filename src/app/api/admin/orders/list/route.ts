import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search")?.toLowerCase();

        let queryRef: FirebaseFirestore.Query = adminDb.collection("orders");

        if (status) {
            queryRef = queryRef.where("status", "==", status);
        }

        const snap = await queryRef.orderBy("createdAt", "desc").get();

        let orders = snap.docs.map((doc) => ({
            firestoreId: doc.id,
            ...doc.data(),
        }));

        /* Client-side search filter (name/email) */
        if (search) {
            orders = orders.filter((o) => {
                const data = o as Record<string, unknown>;
                const name = String(data.customerName || "").toLowerCase();
                const email = String(data.customerEmail || "").toLowerCase();
                return name.includes(search) || email.includes(search);
            });
        }

        return NextResponse.json({ orders });
    } catch (error) {
        console.error("Orders list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
