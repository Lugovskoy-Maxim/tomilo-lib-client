import { rarityFromVoteCount, type Decoration } from "@/api/shop";

export type SuggestionType = "avatar" | "frame" | "background" | "card";

/** Минимальный набор полей предложения для преобразования в Decoration (карточка, превью). */
export interface SuggestionForDecoration {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  type: SuggestionType;
  authorId?: string;
  authorUsername?: string;
  authorLevel?: number;
  /** Если задано — редкость в превью считается по порогам голосов (как у победителей недели). */
  votesCount?: number;
}

/** Преобразует предложение в вид Decoration для превью и карточки в UI. */
export function suggestionToDecoration(s: SuggestionForDecoration): Decoration {
  return {
    id: s.id,
    name: s.name,
    description: s.description || "",
    price: 0,
    imageUrl: s.imageUrl,
    type: s.type,
    rarity: s.votesCount != null ? rarityFromVoteCount(s.votesCount) : "common",
    authorId: s.authorId,
    authorUsername: s.authorUsername,
    authorLevel: s.authorLevel,
  };
}

export const SUGGESTION_TYPES: { id: SuggestionType; label: string }[] = [
  { id: "avatar", label: "Аватар" },
  { id: "frame", label: "Рамка" },
  { id: "background", label: "Фон" },
  { id: "card", label: "Карточка" },
];

/** Требования к декорациям для блока предложений. */
export const DECORATION_RULES = [
  "Изображение: PNG, JPG, WEBP или GIF, не более 20 МБ.",
  "Только своя работа или работа с разрешения автора; не нарушайте авторские права.",
  "Контент должен соответствовать правилам сайта: без оскорбительного, неприемлемого и NSFW-материала.",
  "Один аккаунт — одно предложение в неделю. Редактировать можно только в течение 1 часа после отправки.",
];

const ONE_HOUR_MS = 60 * 60 * 1000;

/** Редактирование предложения доступно в течение 1 часа после создания. */
export function isWithinOneHour(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < ONE_HOUR_MS;
}

/** Следующий понедельник 00:00 (локальное время) — момент принятия победителей недели (топ-3 по голосам). */
export function getNextAcceptanceDate(): Date {
  const now = new Date();
  const next = new Date(now);
  const day = now.getDay();
  const daysToAdd = day === 0 ? 1 : (8 - day) % 7;
  next.setDate(now.getDate() + daysToAdd);
  next.setHours(0, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 7);
  return next;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0 мин.";
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} д.`);
  if (h > 0) parts.push(`${h} ч.`);
  parts.push(`${m} мин.`);
  return parts.join(" ");
}
