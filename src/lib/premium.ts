/**
 * Проверяет, активна ли премиум-подписка: subscriptionExpiresAt задана и в будущем.
 */
export function isPremiumActive(subscriptionExpiresAt: string | null | undefined): boolean {
  if (!subscriptionExpiresAt) return false;
  const date = new Date(subscriptionExpiresAt);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

/**
 * Форматирует дату окончания подписки для отображения.
 */
export function formatSubscriptionEnd(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
