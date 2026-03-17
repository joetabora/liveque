import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { COLLECTION_NAME } from "./constants";
import type { QueueItem, QueueItemInput } from "./types";

function queueRef() {
  return collection(getDb(), COLLECTION_NAME);
}

export async function addToQueue(input: QueueItemInput): Promise<string> {
  const ref = queueRef();
  const waitingQuery = query(
    ref,
    where("status", "==", "waiting"),
    orderBy("position", "desc")
  );
  const snapshot = await getDocs(waitingQuery);
  const maxPosition = snapshot.empty
    ? 0
    : (snapshot.docs[0].data() as QueueItem).position;

  const docRef = await addDoc(ref, {
    name: input.name,
    serviceType: input.serviceType || null,
    status: "waiting",
    position: maxPosition + 1,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function startService(itemId: string): Promise<void> {
  const db = getDb();
  const ref = queueRef();
  const servingQuery = query(ref, where("status", "==", "serving"));
  const servingSnapshot = await getDocs(servingQuery);

  const batch = writeBatch(db);

  servingSnapshot.docs.forEach((d) => {
    batch.update(d.ref, { status: "done" });
  });

  batch.update(doc(db, COLLECTION_NAME, itemId), { status: "serving" });
  await batch.commit();
}

export async function completeService(itemId: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION_NAME, itemId), { status: "done" });
}

export async function callNext(): Promise<boolean> {
  const db = getDb();
  const ref = queueRef();

  const servingQuery = query(ref, where("status", "==", "serving"));
  const servingSnapshot = await getDocs(servingQuery);

  const waitingQuery = query(
    ref,
    where("status", "==", "waiting"),
    orderBy("position", "asc")
  );
  const waitingSnapshot = await getDocs(waitingQuery);

  if (waitingSnapshot.empty) return false;

  const batch = writeBatch(db);

  servingSnapshot.docs.forEach((d) => {
    batch.update(d.ref, { status: "done" });
  });

  const nextDoc = waitingSnapshot.docs[0];
  batch.update(nextDoc.ref, { status: "serving" });

  await batch.commit();
  return true;
}

export async function skipItem(itemId: string): Promise<void> {
  const ref = queueRef();
  const waitingQuery = query(
    ref,
    where("status", "==", "waiting"),
    orderBy("position", "desc")
  );
  const snapshot = await getDocs(waitingQuery);
  const maxPosition = snapshot.empty
    ? 1
    : (snapshot.docs[0].data() as QueueItem).position;

  await updateDoc(doc(getDb(), COLLECTION_NAME, itemId), {
    position: maxPosition + 1,
  });
}

export async function removeItem(itemId: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTION_NAME, itemId));
}

export async function clearQueue(): Promise<void> {
  const db = getDb();
  const snapshot = await getDocs(queueRef());
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function reorderQueue(
  items: { id: string; position: number }[]
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  items.forEach(({ id, position }) => {
    batch.update(doc(db, COLLECTION_NAME, id), { position });
  });
  await batch.commit();
}
