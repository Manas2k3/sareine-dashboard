import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
    try {
        const snap = await adminDb
            .collection("preorders")
            .get();

        const preorders = snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure createdAt is sortable
                _sortTime: data.createdAt && typeof data.createdAt === 'object' && '_seconds' in data.createdAt
                    ? data.createdAt._seconds * 1000
                    : new Date(data.createdAt || 0).getTime()
            };
        });

        // Sort in memory: newest first
        preorders.sort((a, b) => b._sortTime - a._sortTime);

        // Remove the helper field before returning
        preorders.forEach((p) => delete (p as any)._sortTime);

        return NextResponse.json({ preorders });
    } catch (error) {
        console.error("Preorders list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch preorders" },
            { status: 500 }
        );
    }
}
