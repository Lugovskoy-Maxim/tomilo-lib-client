import { baseUrlAPI } from "./config";
import type { EquippedDecorations } from "@/types/user";

const API_BASE = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

/** S3 URL — основной источник изображений */
const s3Origin = process.env.NEXT_PUBLIC_S3_URL?.replace(/\/$/, "") || "";

/** Оригин API (без /api) — для запросов к бэкенду */
const apiOrigin = (() => {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  return api.replace(/\/api\/?$/, "") || "http://localhost:3001";
})();

/** Fallback URL для изображений (старый сервер) */
const uploadsOrigin = process.env.NEXT_PUBLIC_UPLOADS_URL?.replace(/\/$/, "") || apiOrigin;

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

/** URL надетой рамки из equippedDecorations.frame. Только рамка — без подстановки avatar. */
export function getEquippedFrameUrl(equipped: EquippedDecorations | null | undefined): string | null {
  if (!equipped) return null;
  return getDecorationUrlFromValue(equipped.frame);
}

/** URL надетой декорации «аватар» (картинка персонажа) из equippedDecorations.avatar. */
export function getEquippedAvatarDecorationUrl(equipped: EquippedDecorations | null | undefined): string | null {
  if (!equipped) return null;
  return getDecorationUrlFromValue(equipped.avatar);
}

/** URL надетого фона профиля из equippedDecorations.background (строка или объект с imageUrl). */
export function getEquippedBackgroundUrl(equipped: EquippedDecorations | null | undefined): string | null {
  if (!equipped) return null;
  return getDecorationUrlFromValue(equipped.background);
}

/**
 * Возвращает primary и fallback URL для изображения декорации.
 * Primary = S3 (если настроен), fallback = старый сервер.
 */
export function getDecorationImageUrls(imageUrl: string | undefined): { primary: string; fallback: string } {
  if (!imageUrl?.trim()) return { primary: "", fallback: "" };

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      const u = new URL(imageUrl);
      const pathname = u.pathname;
      if (s3Origin) {
        return {
          primary: `${s3Origin}${pathname}`,
          fallback: `${uploadsOrigin}${pathname}`,
        };
      }
      return { primary: imageUrl, fallback: imageUrl };
    } catch {
      return { primary: imageUrl, fallback: imageUrl };
    }
  }

  let path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  if (uploadsOrigin.endsWith("/uploads") && (path.startsWith("/uploads/") || path === "/uploads")) {
    path = path.slice("/uploads".length) || "/";
  }

  if (s3Origin) {
    return {
      primary: `${s3Origin}${path}`,
      fallback: `${uploadsOrigin}${path}`,
    };
  }

  const url = `${uploadsOrigin}${path}`;
  return { primary: url, fallback: url };
}

/** Полный URL изображения декорации (primary URL). Для fallback используйте getDecorationImageUrls(). */
export function getDecorationImageUrl(imageUrl: string | undefined): string {
  return getDecorationImageUrls(imageUrl).primary;
}

export type DecorationRarity = "common" | "rare" | "epic" | "legendary";

const RARITY_VALUES: DecorationRarity[] = ["common", "rare", "epic", "legendary"];

/** Нормализует редкость из API (разный регистр, числа 1–4 или строки). */
export function normalizeRarity(value: unknown): DecorationRarity {
  if (value == null) return "common";
  if (typeof value === "number") {
    const map: DecorationRarity[] = ["common", "rare", "epic", "legendary"];
    const i = Math.floor(Number(value));
    return map[i >= 1 && i <= 4 ? i - 1 : 0] ?? "common";
  }
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (RARITY_VALUES.includes(lower as DecorationRarity)) return lower as DecorationRarity;
    const byLabel: Record<string, DecorationRarity> = {
      обычная: "common",
      редкая: "rare",
      эпическая: "epic",
      легендарная: "legendary",
    };
    if (byLabel[lower]) return byLabel[lower];
  }
  return "common";
}

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
    rarity: normalizeRarity(item.rarity ?? item.rarity_level),
    isAvailable: item.isAvailable as boolean | undefined,
    isEquipped: (item.isEquipped ?? item.is_equipped) as boolean | undefined,
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
