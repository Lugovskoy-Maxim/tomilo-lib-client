"use client";

import { OFFLINE_FEATURES_ENABLED } from "@/config/offlineFeatures";

const OFFLINE_MUTATION_QUEUE_KEY = "offline_mutation_queue_v1";
const AUTH_TOKEN_KEY = "tomilo_lib_token";
const OFFLINE_QUEUE_EVENT = "offline-mutation-queue-updated";
const OFFLINE_SYNC_EVENT = "offline-mutation-sync-state";
const MAX_QUEUE_SIZE = 300;

export interface OfflineMutationQueueItem {
  id: string;
  createdAt: string;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export interface OfflineQueueSnapshot {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

let isSyncing = false;
let lastSyncAt: string | null = null;
let lastError: string | null = null;

function emitQueueUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT));
}

function emitSyncState() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OFFLINE_SYNC_EVENT, {
      detail: getOfflineQueueSnapshot(),
    }),
  );
}

function readQueue(): OfflineMutationQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_MUTATION_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as OfflineMutationQueueItem[];
  } catch {
    return [];
  }
}

export function getOfflineQueueItems(): OfflineMutationQueueItem[] {
  return readQueue();
}

function writeQueue(items: OfflineMutationQueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = items.slice(-MAX_QUEUE_SIZE);
    window.localStorage.setItem(OFFLINE_MUTATION_QUEUE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore
  }
  emitQueueUpdate();
}

function toAbsoluteApiUrl(baseUrl: string, url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
}

function normalizeUrlPath(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url.startsWith("/") ? url : `/${url}`;
}

function getMergeKey(item: Omit<OfflineMutationQueueItem, "id" | "createdAt">): string | null {
  const path = normalizeUrlPath(item.url);
  const method = item.method;

  if (method === "POST" && /^\/users\/profile\/history\/[^/]+\/[^/]+$/.test(path)) {
    return `history:${path}`;
  }

  if (["POST", "PUT", "DELETE"].includes(method) && /^\/users\/profile\/bookmarks\/[^/?]+$/.test(path)) {
    const titleId = path.split("/").pop() ?? "";
    return `bookmark:${titleId}`;
  }

  if (method === "POST" && /^\/comments\/[^/]+\/reactions$/.test(path)) {
    const commentId = path.split("/")[2] ?? "";
    return `comment-reaction:${commentId}`;
  }

  if (method === "POST" && /^\/chapters\/[^/]+\/reactions$/.test(path)) {
    const chapterId = path.split("/")[2] ?? "";
    return `chapter-reaction:${chapterId}`;
  }

  if (method === "POST" && /^\/chapters\/[^/]+\/rating$/.test(path)) {
    const chapterId = path.split("/")[2] ?? "";
    return `chapter-rating:${chapterId}`;
  }

  return null;
}

function getSyncPriority(item: OfflineMutationQueueItem): number {
  const path = normalizeUrlPath(item.url);
  if (/^\/users\/profile\/history\/[^/]+\/[^/]+$/.test(path)) return 10;
  if (/^\/users\/profile\/bookmarks\/[^/?]+$/.test(path)) return 20;
  if (/^\/chapters\/[^/]+\/rating$/.test(path)) return 30;
  if (/^\/chapters\/[^/]+\/reactions$/.test(path)) return 40;
  if (/^\/comments\/[^/]+\/reactions$/.test(path)) return 50;
  if (path === "/comments" && item.method === "POST") return 60;
  return 100;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function canQueueBody(body: unknown): boolean {
  if (body == null) return true;
  if (typeof body === "string") return true;
  if (typeof body === "number" || typeof body === "boolean") return true;
  if (Array.isArray(body)) return true;
  if (typeof body === "object") {
    if (typeof FormData !== "undefined" && body instanceof FormData) return false;
    if (typeof Blob !== "undefined" && body instanceof Blob) return false;
    return true;
  }
  return false;
}

export function enqueueOfflineMutation(item: Omit<OfflineMutationQueueItem, "id" | "createdAt">): void {
  if (!OFFLINE_FEATURES_ENABLED) return;
  if (typeof window === "undefined") return;
  const nextItem: OfflineMutationQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  const mergeKey = getMergeKey(item);
  const queue = readQueue();
  if (!mergeKey) {
    writeQueue([...queue, nextItem]);
    return;
  }
  const filtered = queue.filter(existing => {
    const existingMergeKey = getMergeKey({
      url: existing.url,
      method: existing.method,
      body: existing.body,
    });
    return existingMergeKey !== mergeKey;
  });
  writeQueue([...filtered, nextItem]);
}

export function getOfflineQueueSnapshot(): OfflineQueueSnapshot {
  return {
    pendingCount: readQueue().length,
    isSyncing,
    lastSyncAt,
    lastError,
  };
}

export function clearOfflineMutationQueue(): void {
  writeQueue([]);
  lastError = null;
  emitSyncState();
}

export function subscribeOfflineQueue(
  onChange: (snapshot: OfflineQueueSnapshot) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const emit = () => onChange(getOfflineQueueSnapshot());
  const onQueue = () => emit();
  const onSync = () => emit();
  window.addEventListener(OFFLINE_QUEUE_EVENT, onQueue as EventListener);
  window.addEventListener(OFFLINE_SYNC_EVENT, onSync as EventListener);
  emit();
  return () => {
    window.removeEventListener(OFFLINE_QUEUE_EVENT, onQueue as EventListener);
    window.removeEventListener(OFFLINE_SYNC_EVENT, onSync as EventListener);
  };
}

export async function flushOfflineMutationQueue(apiBaseUrl: string): Promise<{
  processed: number;
  failed: number;
}> {
  if (!OFFLINE_FEATURES_ENABLED) return { processed: 0, failed: 0 };
  if (typeof window === "undefined") return { processed: 0, failed: 0 };
  if (isSyncing) return { processed: 0, failed: 0 };
  if (navigator.onLine === false) return { processed: 0, failed: 0 };

  isSyncing = true;
  lastError = null;
  emitSyncState();

  const queue = [...readQueue()].sort((a, b) => {
    const byPriority = getSyncPriority(a) - getSyncPriority(b);
    if (byPriority !== 0) return byPriority;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  if (queue.length === 0) {
    isSyncing = false;
    lastSyncAt = new Date().toISOString();
    emitSyncState();
    return { processed: 0, failed: 0 };
  }

  const remaining: OfflineMutationQueueItem[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(toAbsoluteApiUrl(apiBaseUrl, item.url), {
        method: item.method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: item.body == null ? undefined : JSON.stringify(item.body),
      });
      if (!response.ok) {
        failed += 1;
        remaining.push(item);
      } else {
        processed += 1;
      }
    } catch (error) {
      failed += 1;
      remaining.push(item);
      lastError = error instanceof Error ? error.message : "Offline sync failed";
    }
  }

  writeQueue(remaining);
  isSyncing = false;
  lastSyncAt = new Date().toISOString();
  emitSyncState();
  return { processed, failed };
}

