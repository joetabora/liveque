import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore, type CollectionReference } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
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
