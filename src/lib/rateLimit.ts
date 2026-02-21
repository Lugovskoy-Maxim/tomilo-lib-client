/**
 * In-memory rate limiter для защиты API от DDoS и злоупотреблений.
 * Ограничивает количество запросов с одного IP за заданное окно времени.
 *
 * Для продакшена с несколькими инстансами рекомендуется Redis
 * (например @upstash/ratelimit) — хранилище сбрасывается при рестарте и не общее между инстансами.
 */

export interface RateLimitOptions {
  /** Максимум запросов за окно */
  max: number;
  /** Окно в секундах */
  windowSec: number;
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/** Очистка устаревших записей раз в минуту */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Проверяет лимит для ключа (обычно IP). Возвращает true, если запрос разрешён.
 * При превышении лимита возвращает false и вызывающий код должен вернуть 429.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): { allowed: boolean; retryAfterSec?: number } {
  cleanup();
  const now = Date.now();
  const windowMs = options.windowSec * 1000;
  let entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > options.max) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true };
}

/** Получить IP из Request (Next.js / Vercel) */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
