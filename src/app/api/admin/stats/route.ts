import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
    try {
        /* Fetch all orders */
        const ordersSnap = await adminDb.collection("orders").get();
        const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        /* Fetch all preorders */
        const preordersSnap = await adminDb.collection("preorders").get();
        const preorders = preordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        /* Aggregate stats */
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce(
            (sum, o: Record<string, unknown>) => sum + (Number(o.amount) || 0),
            0
        );
        const pendingPreorders = preorders.filter(
            (p: Record<string, unknown>) => p.status === "pending_confirmation"
        ).length;
        const toDispatch = orders.filter(
            (o: Record<string, unknown>) => o.status === "paid"
        ).length;

        /* Revenue by date (last 30 days) */
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const revenueByDate: Record<string, number> = {};

        for (const o of orders) {
            const ord = o as Record<string, unknown>;
            const ts = ord.createdAt;
            let date: string | null = null;

            if (ts && typeof ts === "object" && "_seconds" in (ts as object)) {
                const ms = ((ts as { _seconds: number })._seconds) * 1000;
                if (ms >= thirtyDaysAgo) {
                    date = new Date(ms).toISOString().split("T")[0];
                }
            } else if (typeof ts === "string") {
                const ms = new Date(ts).getTime();
                if (ms >= thirtyDaysAgo) {
                    date = new Date(ms).toISOString().split("T")[0];
                }
            }

            if (date) {
                revenueByDate[date] = (revenueByDate[date] || 0) + (Number(ord.amount) || 0);
            }
        }

        /* Recent activity (last 10 items) */
        const allItems = [
            ...orders.map((o) => ({
                type: "order" as const,
                ...(o as Record<string, unknown>),
            })),
            ...preorders.map((p) => ({
                type: "preorder" as const,
                ...(p as Record<string, unknown>),
            })),
        ];

        allItems.sort((a, b) => {
            const getMs = (item: Record<string, unknown>) => {
                const ts = item.createdAt;
                if (ts && typeof ts === "object" && "_seconds" in (ts as object)) {
                    return ((ts as { _seconds: number })._seconds) * 1000;
                }
                if (typeof ts === "string") return new Date(ts).getTime();
                return 0;
            };
            return getMs(b) - getMs(a);
        });

        const recentActivity = allItems.slice(0, 10).map((raw) => {
            const item = raw as Record<string, unknown>;
            /* Orders: name/email in shippingAddress; Preorders: top-level customerName/customerEmail */
            const shipping = item.shippingAddress as Record<string, unknown> | undefined;
            const name =
                (item.customerName as string) ||
                (shipping?.name as string) ||
                "Unknown";
            const email =
                (item.customerEmail as string) ||
                (shipping?.email as string) ||
                "";
            return {
                type: raw.type,
                id: (item.id as string) || "",
                customerName: name,
                customerEmail: email,
                amount: Number(item.amount) || 0,
                status: (item.status as string) || "unknown",
                createdAt: item.createdAt,
            };
        });

        return NextResponse.json({
            totalOrders,
            totalRevenue,
            pendingPreorders,
            toDispatch,
            revenueByDate,
            recentActivity,
            totalPreorders: preorders.length,
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
