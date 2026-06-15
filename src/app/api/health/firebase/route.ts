import { getFirebaseAdminConfig, getAdminDb } from "@/lib/firebase-admin";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";

export async function GET() {
  try {
    const config = getFirebaseAdminConfig();

    if (!config.configured) {
      return jsonSuccess({
        ok: false,
        error: "Firebase Admin env vars missing",
        hasProjectId: !!config.projectId,
        hasClientEmail: !!config.clientEmail,
        hasPrivateKey: !!config.privateKey,
      });
    }

    if (!config.privateKeyLooksValid) {
      return jsonSuccess({
        ok: false,
        error:
          "FIREBASE_PRIVATE_KEY is malformed. Paste the full key including BEGIN/END lines. On Vercel, use \\n for line breaks.",
        privateKeyLooksValid: false,
      });
    }

    const db = getAdminDb();
    await db.collection("_liveque_health").limit(1).get();

    return jsonSuccess({
      ok: true,
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKeyLooksValid: config.privateKeyLooksValid,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
