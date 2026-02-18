import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
    try {
        const snap = await adminDb
            .collection("preorders")
            .orderBy("createdAt", "desc")
            .get();

        const preorders = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ preorders });
    } catch (error) {
        console.error("Preorders list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch preorders" },
            { status: 500 }
        );
    }
}
