import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore, type CollectionReference } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

export function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

export function getFirebaseAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = privateKeyRaw ? normalizePrivateKey(privateKeyRaw) : undefined;

  return {
    projectId,
    clientEmail,
    privateKey,
    configured: !!(projectId && clientEmail && privateKey),
    privateKeyLooksValid: !!privateKey?.includes("BEGIN PRIVATE KEY"),
  };
}

function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const { projectId, clientEmail, privateKey, configured } =
    getFirebaseAdminConfig();

  if (configured && projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel."
      );
    }
    adminApp = initializeApp({ projectId: projectId ?? "demo" });
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}

export function tenantQueueCollection(tenantId: string): CollectionReference {
  return getAdminDb().collection("tenants").doc(tenantId).collection("queue");
}

export function tenantQueueDoc(tenantId: string, itemId: string) {
  return tenantQueueCollection(tenantId).doc(itemId);
}

export const LEGACY_QUEUE_COLLECTION = "queue";

export function legacyQueueCollection(): CollectionReference {
  return getAdminDb().collection(LEGACY_QUEUE_COLLECTION);
}

export function legacyQueueDoc(itemId: string) {
  return legacyQueueCollection().doc(itemId);
}

export function getQueueCollection(
  tenantId: string | null,
  useLegacy: boolean
): CollectionReference {
  if (useLegacy || !tenantId) {
    return legacyQueueCollection();
  }
  return tenantQueueCollection(tenantId);
}

export function getQueueDoc(
  tenantId: string | null,
  itemId: string,
  useLegacy: boolean
) {
  if (useLegacy || !tenantId) {
    return legacyQueueDoc(itemId);
  }
  return tenantQueueDoc(tenantId, itemId);
}
