import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Diagnostic endpoint — DELETE after debugging.
 * Tests Firebase Admin connectivity on Vercel.
 */
export async function GET() {
    const checks: Record<string, string> = {};

    // 1. Check env vars
    checks["FIREBASE_SERVICE_ACCOUNT_KEY"] = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? `SET (${process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length} chars)`
        : "NOT SET";
    checks["GMAIL_USER"] = process.env.GMAIL_USER ? "SET" : "NOT SET";
    checks["GMAIL_APP_PASSWORD"] = process.env.GMAIL_APP_PASSWORD ? "SET" : "NOT SET";
    checks["RZP_TEST_KEY_ID"] = process.env.RZP_TEST_KEY_ID ? "SET" : "NOT SET";
    checks["RZP_KEY_SECRET"] = process.env.RZP_KEY_SECRET ? "SET" : "NOT SET";

    // 2. Test Firestore read
    try {
        const snap = await adminDb.collection("preorders").limit(1).get();
        checks["firestore_read"] = `OK — ${snap.size} doc(s) returned`;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        checks["firestore_read"] = `FAIL — ${message}`;
    }

    // 3. Test Firestore write (to a temp collection)
    try {
        const testRef = adminDb.collection("_debug_test").doc("ping");
        await testRef.set({ ts: new Date().toISOString(), source: "debug-endpoint" });
        await testRef.delete();
        checks["firestore_write"] = "OK — write + delete succeeded";
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        checks["firestore_write"] = `FAIL — ${message}`;
    }

    // 4. Parse service account JSON check
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            checks["service_account_parse"] = `OK — project_id: ${parsed.project_id}, client_email: ${parsed.client_email}`;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            checks["service_account_parse"] = `FAIL — ${message}`;
        }
    }

    return NextResponse.json({ checks, timestamp: new Date().toISOString() });
}
