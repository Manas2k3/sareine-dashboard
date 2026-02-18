import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search")?.toLowerCase();

        const usersSnap = await adminDb.collection("users").get();
        const ordersSnap = await adminDb.collection("orders").get();

        /* Build order summary per user */
        const ordersByUser: Record<
            string,
            { count: number; totalSpend: number; orders: Record<string, unknown>[] }
        > = {};

        for (const doc of ordersSnap.docs) {
            const data = doc.data();
            const userId = String(data.userId || data.customerEmail || "unknown");
            if (!ordersByUser[userId]) {
                ordersByUser[userId] = { count: 0, totalSpend: 0, orders: [] };
            }
            ordersByUser[userId].count++;
            ordersByUser[userId].totalSpend += Number(data.amount) || 0;
            ordersByUser[userId].orders.push({
                id: doc.id,
                amount: data.amount,
                status: data.status,
                createdAt: data.createdAt,
                items: data.items,
            });
        }

        let customers = usersSnap.docs.map((doc) => {
            const data = doc.data();
            const userId = doc.id;
            const orderSummary = ordersByUser[userId] ||
                ordersByUser[String(data.email)] || {
                count: 0,
                totalSpend: 0,
                orders: [],
            };

            return {
                id: userId,
                displayName: data.displayName || "Unknown",
                email: data.email || "",
                photoURL: data.photoURL || "",
                phone: data.phone || "",
                createdAt: data.createdAt,
                orderCount: orderSummary.count,
                totalSpend: orderSummary.totalSpend,
                orders: orderSummary.orders,
            };
        });

        /* Search filter */
        if (search) {
            customers = customers.filter(
                (c) =>
                    c.displayName.toLowerCase().includes(search) ||
                    c.email.toLowerCase().includes(search) ||
                    c.phone.toLowerCase().includes(search)
            );
        }

        return NextResponse.json({ customers });
    } catch (error) {
        console.error("Customers list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch customers" },
            { status: 500 }
        );
    }
}
