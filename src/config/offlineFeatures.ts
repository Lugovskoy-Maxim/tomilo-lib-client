/**
 * Оффлайн-функции: скачивание глав, кеш SW, очередь мутаций, режим `offlineRead`.
 * По умолчанию выключено. Включить: в `.env` задать `NEXT_PUBLIC_OFFLINE_FEATURES=1` и пересобрать клиент.
 */
export const OFFLINE_FEATURES_ENABLED =
  process.env.NEXT_PUBLIC_OFFLINE_FEATURES === "1";
