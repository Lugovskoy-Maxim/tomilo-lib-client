import { baseUrlAPI } from "./config";
import type { EquippedDecorations } from "@/types/user";

const API_BASE = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

/** Базовый URL сервера (без /api) — с него отдаются /uploads/... */
const uploadsOrigin = (() => {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  return api.replace(/\/api\/?$/, "") || "http://localhost:3001";
})();

/** Извлекает URL картинки из значения декорации (строка пути/URL или объект при populate с imageUrl). */
function getDecorationUrlFromValue(raw: string | object | null | undefined): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    return raw.startsWith("http") ? raw : getDecorationImageUrl(raw) || `${API_BASE}${raw}`;
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const imageUrl = (o.imageUrl ?? o.image_url) as string | undefined;
    if (imageUrl) return getDecorationImageUrl(imageUrl) || imageUrl;
  }
  return null;
}

/** URL надетой рамки из equippedDecorations.frame (или устаревшее avatar). */
export function getEquippedFrameUrl(equipped: EquippedDecorations | null | undefined): string | null {
  if (!equipped) return null;
  return getDecorationUrlFromValue(equipped.frame ?? equipped.avatar);
}

/** URL надетой декорации «аватар» (картинка персонажа) из equippedDecorations.avatar. */
export function getEquippedAvatarDecorationUrl(equipped: EquippedDecorations | null | undefined): string | null {
  if (!equipped) return null;
  return getDecorationUrlFromValue(equipped.avatar);
}

/** Полный URL изображения декорации (imageUrl с бэкенда — относительный путь /uploads/...) */
export function getDecorationImageUrl(imageUrl: string | undefined): string {
  if (!imageUrl?.trim()) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  let path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  // Не дублировать uploads: если база уже .../uploads, убрать ведущий /uploads из path
  if (uploadsOrigin.endsWith("/uploads") && (path.startsWith("/uploads/") || path === "/uploads")) {
    path = path.slice("/uploads".length) || "/";
  }
  return `${uploadsOrigin}${path}`;
}

export type DecorationRarity = "common" | "rare" | "epic" | "legendary";

export interface Decoration {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  type: "avatar" | "frame" | "background" | "card";
  rarity?: DecorationRarity;
  isAvailable?: boolean;
  isEquipped?: boolean;
  /** Количество оставшихся (если ограничено). Не задано — без лимита. */
  stock?: number;
  /** Распродано — покупка недоступна. */
  isSoldOut?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  path: string;
  method?: string;
}

/** Нормализует элемент из ответа API (поддержка snake_case и _id) */
function normalizeDecorationFromApi(item: Record<string, unknown>): Decoration {
  const stock = (item.stock ?? item.quantity_remaining) as number | undefined;
  const isSoldOut = (item.isSoldOut ?? item.is_sold_out ?? item.sold_out) as boolean | undefined;
  return {
    id: (item.id ?? item._id) as string,
    name: (item.name as string) ?? "",
    description: (item.description as string) ?? "",
    price: (item.price as number) ?? 0,
    imageUrl: (item.imageUrl ?? item.image_url) as string ?? "",
    type: (item.type as Decoration["type"]) ?? "avatar",
    rarity: item.rarity as Decoration["rarity"],
    isAvailable: item.isAvailable as boolean | undefined,
    isEquipped: item.isEquipped as boolean | undefined,
    stock: stock != null ? Number(stock) : undefined,
    isSoldOut: isSoldOut ?? (stock != null && Number(stock) <= 0),
  };
}

// Get all available decorations
export const getAllDecorations = async (): Promise<ApiResponse<Decoration[]>> => {
  const response = await fetch(`${baseUrlAPI}/shop/decorations`);
  const json = await response.json();
  if (json.success && Array.isArray(json.data)) {
    json.data = (json.data as Record<string, unknown>[]).map(normalizeDecorationFromApi);
  }
  return json;
};

// Get decorations by type
export const getDecorationsByType = async (
  type: "avatar" | "frame" | "background" | "card",
): Promise<ApiResponse<Decoration[]>> => {
  const response = await fetch(`${baseUrlAPI}/shop/decorations/${type}`);
  const json = await response.json();
  if (json.success && Array.isArray(json.data)) {
    json.data = (json.data as Record<string, unknown>[]).map(normalizeDecorationFromApi);
  }
  return json;
};

// Get user's owned decorations (requires auth)
export const getUserDecorations = async (): Promise<ApiResponse<Decoration[]>> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("tomilo_lib_token") : null;
  const response = await fetch(`${baseUrlAPI}/shop/profile/decorations`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await response.json();
  if (json.success && Array.isArray(json.data)) {
    json.data = (json.data as Record<string, unknown>[]).map(normalizeDecorationFromApi);
  }
  return json;
};

// Purchase decoration (requires auth)
export const purchaseDecoration = async (
  type: "avatar" | "frame" | "background" | "card",
  decorationId: string,
): Promise<ApiResponse<{ message: string; balance?: number }>> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("tomilo_lib_token") : null;
  const response = await fetch(`${baseUrlAPI}/shop/purchase/${type}/${decorationId}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return response.json();
};

// Equip decoration (requires auth)
export const equipDecoration = async (
  type: "avatar" | "frame" | "background" | "card",
  decorationId: string,
): Promise<ApiResponse<{ message: string; decorationId: string }>> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("tomilo_lib_token") : null;
  const response = await fetch(`${baseUrlAPI}/shop/equip/${type}/${decorationId}`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return response.json();
};

// Unequip decoration (requires auth)
export const unequipDecoration = async (
  type: "avatar" | "frame" | "background" | "card",
): Promise<ApiResponse<{ message: string }>> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("tomilo_lib_token") : null;
  const response = await fetch(`${baseUrlAPI}/shop/equip/${type}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return response.json();
};

// --- Admin API (requires admin role) ---

export type DecorationType = "avatar" | "frame" | "background" | "card";

export interface CreateDecorationDto {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  type: DecorationType;
  rarity?: DecorationRarity;
  isAvailable?: boolean;
  /** Лимит количества в магазине. Не задано — без лимита. */
  stock?: number;
}

export interface UpdateDecorationDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  type?: DecorationType;
  rarity?: DecorationRarity;
  isAvailable?: boolean;
  /** Лимит количества в магазине. Не задано — без лимита. */
  stock?: number;
}

export const createDecoration = async (
  dto: CreateDecorationDto,
): Promise<ApiResponse<Decoration>> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("tomilo_lib_token") : null;
  const response = await fetch(`${baseUrlAPI}/shop/admin/decorations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(dto),
  });
  return response.json();
};

export const updateDecoration = async (
  id: string,
  dto: UpdateDecorationDto,
): Promise<ApiResponse<Decoration>> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("tomilo_lib_token") : null;
  const response = await fetch(`${baseUrlAPI}/shop/admin/decorations/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(dto),
  });
  return response.json();
};

export const deleteDecoration = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("tomilo_lib_token") : null;
  const response = await fetch(`${baseUrlAPI}/shop/admin/decorations/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return response.json();
};
