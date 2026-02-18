import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json(
                { error: "Missing product id" },
                { status: 400 }
            );
        }

        const docRef = adminDb.collection("products").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        await docRef.delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Product delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
