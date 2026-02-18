/**
 * Firebase Admin SDK — server-side only.
 *
 * Initialisation strategy:
 *  1. If FIREBASE_SERVICE_ACCOUNT_KEY env var is set (Vercel / CI),
 *     parse the JSON string and use `cert()`.
 *  2. Otherwise fall back to the local `service-account.json` file (dev).
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    /* --- Vercel / CI (JSON string in env var) --- */
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        return initializeApp({
            credential: cert(serviceAccount),
        });
    }

    /* --- Local development (file on disk) --- */
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const serviceAccount = require("../../../service-account.json");
        return initializeApp({
            credential: cert(serviceAccount),
        });
    } catch {
        console.error("Firebase Admin Init Error: service-account.json not found and FIREBASE_SERVICE_ACCOUNT_KEY not set.");
        throw new Error("Missing Firebase Admin credentials");
    }
}

const adminApp = getAdminApp();
const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };
