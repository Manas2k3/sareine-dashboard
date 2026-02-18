import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const SETTINGS_DOC = "site_config";

export async function GET() {
    try {
        const doc = await adminDb.collection("settings").doc(SETTINGS_DOC).get();
        if (!doc.exists) {
            return NextResponse.json({
                settings: {
                    preorderEnabled: false,
                    announcementText: "",
                    senderName: "Sareine",
                },
            });
        }
        return NextResponse.json({ settings: doc.data() });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        await adminDb.collection("settings").doc(SETTINGS_DOC).set(
            {
                preorderEnabled: body.preorderEnabled ?? false,
                announcementText: body.announcementText ?? "",
                senderName: body.senderName ?? "Sareine",
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
