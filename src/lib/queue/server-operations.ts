import { FieldValue } from "firebase-admin/firestore";
import {
  getAdminDb,
  getQueueCollection,
  getQueueDoc,
} from "@/lib/firebase-admin";
import type { QueueItemInput, QueueItemUpdate } from "@/lib/types";

export async function serverAddToQueue(
  tenantId: string | null,
  input: QueueItemInput,
  useLegacy = false,
  createdBy?: string
): Promise<string> {
  const col = getQueueCollection(tenantId, useLegacy);
  const docRef = await col.add({
    name: input.name,
    hereToSee: input.hereToSee?.trim() || null,
    serviceType: input.serviceType || null,
    status: "waiting",
    position: Date.now(),
    createdAt: FieldValue.serverTimestamp(),
    ...(createdBy ? { createdBy } : {}),
  });
  return docRef.id;
}

export async function serverUpdateQueueItem(
  tenantId: string | null,
  itemId: string,
  input: QueueItemUpdate,
  useLegacy = false
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  await getQueueDoc(tenantId, itemId, useLegacy).update({
    name,
    hereToSee: input.hereToSee?.trim() || null,
  });
}

export async function serverStartService(
  tenantId: string | null,
  itemId: string,
  useLegacy = false
): Promise<void> {
  const db = getAdminDb();
  const col = getQueueCollection(tenantId, useLegacy);

  const servingSnapshot = await col.where("status", "==", "serving").get();
  const batch = db.batch();

  servingSnapshot.docs.forEach((d) => {
    batch.update(d.ref, { status: "done" });
  });

  batch.update(getQueueDoc(tenantId, itemId, useLegacy), { status: "serving" });
  await batch.commit();
}

export async function serverCompleteService(
  tenantId: string | null,
  itemId: string,
  useLegacy = false
): Promise<void> {
  await getQueueDoc(tenantId, itemId, useLegacy).update({ status: "done" });
}

export async function serverCallNext(
  tenantId: string | null,
  useLegacy = false
): Promise<boolean> {
  const db = getAdminDb();
  const col = getQueueCollection(tenantId, useLegacy);

  const [servingSnapshot, waitingSnapshot] = await Promise.all([
    col.where("status", "==", "serving").get(),
    col.where("status", "==", "waiting").orderBy("position", "asc").limit(1).get(),
  ]);

  if (waitingSnapshot.empty) return false;

  const batch = db.batch();
  servingSnapshot.docs.forEach((d) => {
    batch.update(d.ref, { status: "done" });
  });
  batch.update(waitingSnapshot.docs[0].ref, { status: "serving" });
  await batch.commit();
  return true;
}

export async function serverSkipItem(
  tenantId: string | null,
  itemId: string,
  useLegacy = false
): Promise<void> {
  await getQueueDoc(tenantId, itemId, useLegacy).update({
    position: Date.now(),
  });
}

export async function serverRemoveItem(
  tenantId: string | null,
  itemId: string,
  useLegacy = false
): Promise<void> {
  await getQueueDoc(tenantId, itemId, useLegacy).delete();
}

export async function serverClearQueue(
  tenantId: string | null,
  useLegacy = false
): Promise<void> {
  const db = getAdminDb();
  const col = getQueueCollection(tenantId, useLegacy);
  const snapshot = await col.get();
  const batch = db.batch();
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function serverReorderQueue(
  tenantId: string | null,
  items: { id: string; position: number }[],
  useLegacy = false
): Promise<void> {
  const db = getAdminDb();
  const batch = db.batch();

  items.forEach(({ id, position }) => {
    batch.update(getQueueDoc(tenantId, id, useLegacy), { position });
  });

  await batch.commit();
}

export async function serverCheckIn(
  tenantId: string,
  input: QueueItemInput
): Promise<string> {
  return serverAddToQueue(tenantId, input, false);
}
