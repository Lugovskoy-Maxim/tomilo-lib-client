import { GAME_ITEMS_LORE } from "@/constants/gameItemsLore";
import type { InventoryEntry } from "@/types/games";

const LORE_BY_ID = new Map(GAME_ITEMS_LORE.map((e) => [e.id, e]));

function looksLikeStackRow(x: unknown): x is Record<string, unknown> {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const id = o.itemId ?? o.id ?? o.gameItemId ?? o.slug ?? o.code;
  const qty = o.count ?? o.quantity ?? o.amount ?? o.qty ?? o.stackSize ?? o.total;
  const hasId = typeof id === "string" || typeof id === "number";
  const hasQty = typeof qty === "number" || typeof qty === "string";
  return hasId && hasQty;
}

function parseStackCount(q: unknown): number {
  if (typeof q === "number" && Number.isFinite(q)) return Math.trunc(q);
  if (typeof q === "string") {
    const n = parseInt(q.replace(/\s/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function extractItemIdFromRow(r: Record<string, unknown>): string {
  const direct = r.itemId ?? r.id ?? r.gameItemId ?? r.slug ?? r.code;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (typeof direct === "number" && Number.isFinite(direct)) return String(direct);
  const item = r.item;
  if (item && typeof item === "object") {
    const io = item as Record<string, unknown>;
    const nested = io.itemId ?? io.id ?? io.slug ?? io.code;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
    if (typeof nested === "number" && Number.isFinite(nested)) return String(nested);
  }
  return "";
}

/** Нормализация для сопоставления id из API с каноническими ключами клиента */
function normalizeItemKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
}

function gatherInventoryRowArrays(root: unknown): unknown[] {
  if (root == null) return [];
  const wrapped = root as { data?: unknown };
  const inner = wrapped?.data !== undefined ? wrapped.data : root;

  const candidates: unknown[] = [];
  if (Array.isArray(inner)) {
    candidates.push(inner);
  } else if (inner && typeof inner === "object") {
    const o = inner as Record<string, unknown>;
    const keys = ["items", "inventory", "entries", "stacks", "gameItems", "userGameItems", "bag", "consumables"];
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) candidates.push(v);
    }
    const profile = o.profile;
    if (profile && typeof profile === "object") {
      const po = profile as Record<string, unknown>;
      for (const k of keys) {
        const v = po[k];
        if (Array.isArray(v)) candidates.push(v);
      }
    }
  }

  for (const arr of candidates) {
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const ok = arr.filter(looksLikeStackRow);
    if (ok.length > 0) return ok;
  }

  if (Array.isArray(inner) && inner.length > 0) {
    const ok = inner.filter(looksLikeStackRow);
    if (ok.length > 0) return ok;
    return inner;
  }

  return [];
}

/**
 * Приводит ответ GET /users/profile/inventory к плоскому списку и сливает дубликаты по itemId (без учёта регистра).
 */
export function normalizeGameInventoryList(apiResponse: unknown): InventoryEntry[] {
  const rows = gatherInventoryRowArrays(apiResponse);

  const canonicalByLower = new Map<string, string>();
  const merged = new Map<string, InventoryEntry>();

  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const itemId = extractItemIdFromRow(r);
    if (!itemId) continue;
    const count = parseStackCount(r.count ?? r.quantity ?? r.amount ?? r.qty ?? r.stackSize ?? r.total);
    if (count <= 0) continue;
    const name = typeof r.name === "string" ? r.name : typeof r.label === "string" ? r.label : undefined;
    const icon = typeof r.icon === "string" ? r.icon : undefined;

    const lower = normalizeItemKey(itemId);
    const canonical = canonicalByLower.get(lower) ?? itemId;
    canonicalByLower.set(lower, canonical);

    const prev = merged.get(canonical);
    if (prev) {
      merged.set(canonical, {
        ...prev,
        count: (Number(prev.count) || 0) + count,
        name: prev.name ?? name,
        icon: prev.icon ?? icon,
      });
    } else {
      merged.set(canonical, { itemId: canonical, count, name, icon });
    }
  }

  return [...merged.values()];
}

/**
 * Число предметов по каноническому id (как в GAME_ITEMS_LORE / лавке).
 * Учитывает расхождение регистра / разделителей id и совпадение имени с лором.
 */
export function countInventoryForCanonicalId(entries: InventoryEntry[], canonicalId: string): number {
  const lore = LORE_BY_ID.get(canonicalId);
  const loreName = lore?.name?.trim().toLowerCase();
  const canonNorm = normalizeItemKey(canonicalId);
  let total = 0;

  for (const e of entries) {
    const c = Number(e.count);
    if (!Number.isFinite(c) || c <= 0) continue;
    const id = String(e.itemId ?? "").trim();
    const idNorm = normalizeItemKey(id);
    if (id === canonicalId || id.toLowerCase() === canonicalId.toLowerCase() || idNorm === canonNorm) {
      total += c;
      continue;
    }
    if (loreName && e.name?.trim()) {
      const en = e.name.trim().toLowerCase();
      if (en === loreName) {
        total += c;
      }
    }
  }
  return total;
}

export function findInventoryEntryForCanonicalId(
  entries: InventoryEntry[],
  canonicalId: string,
): InventoryEntry | undefined {
  const lore = LORE_BY_ID.get(canonicalId);
  const loreName = lore?.name?.trim().toLowerCase();
  const canonNorm = normalizeItemKey(canonicalId);
  for (const e of entries) {
    const id = String(e.itemId ?? "").trim();
    const idNorm = normalizeItemKey(id);
    if (id === canonicalId || id.toLowerCase() === canonicalId.toLowerCase() || idNorm === canonNorm) return e;
  }
  if (loreName) {
    for (const e of entries) {
      if (e.name?.trim().toLowerCase() === loreName) return e;
    }
  }
  return undefined;
}
