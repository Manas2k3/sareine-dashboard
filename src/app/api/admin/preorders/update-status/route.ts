import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
    try {
        const { firestoreId, status } = (await req.json()) as {
            firestoreId: string;
            status: string;
        };

        if (!firestoreId || !status) {
            return NextResponse.json(
                { error: "Missing firestoreId or status" },
                { status: 400 }
            );
        }

        const docRef = adminDb.collection("preorders").doc(firestoreId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json(
                { error: "Preorder not found" },
                { status: 404 }
            );
        }

        await docRef.update({
            status,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Preorder status update error:", error);
        return NextResponse.json(
            { error: "Failed to update preorder status" },
            { status: 500 }
        );
    }
}
