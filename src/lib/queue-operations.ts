import type { QueueItemInput, QueueItemUpdate } from "@/lib/types";

async function apiFetch(slug: string, path: string, options?: RequestInit) {
  const res = await fetch(`/api/tenants/${slug}/queue${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export async function addToQueue(
  slug: string,
  input: QueueItemInput
): Promise<string> {
  const data = await apiFetch(slug, "", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.id;
}

export async function updateQueueItem(
  slug: string,
  itemId: string,
  input: QueueItemUpdate
): Promise<void> {
  await apiFetch(slug, `/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function startService(
  slug: string,
  itemId: string
): Promise<void> {
  await apiFetch(slug, `/items/${itemId}/serve`, { method: "POST" });
}

export async function completeService(
  slug: string,
  itemId: string
): Promise<void> {
  await apiFetch(slug, `/items/${itemId}/complete`, { method: "POST" });
}

export async function callNext(slug: string): Promise<boolean> {
  const data = await apiFetch(slug, "/call-next", { method: "POST" });
  return data.called;
}

export async function skipItem(slug: string, itemId: string): Promise<void> {
  await apiFetch(slug, `/items/${itemId}/skip`, { method: "POST" });
}

export async function removeItem(slug: string, itemId: string): Promise<void> {
  await apiFetch(slug, `/items/${itemId}`, { method: "DELETE" });
}

export async function clearQueue(slug: string): Promise<void> {
  await apiFetch(slug, "", { method: "DELETE" });
}

export async function reorderQueue(
  slug: string,
  items: { id: string; position: number }[]
): Promise<void> {
  await apiFetch(slug, "/reorder", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function checkIn(
  slug: string,
  input: QueueItemInput
): Promise<string> {
  const res = await fetch(`/api/tenants/${slug}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Check-in failed");
  return data.id;
}
