// Константы сообщений об ошибках

export const ERROR_MESSAGES = {
  // Ошибки аутентификации
  AUTH: {
    UPDATE_AVATAR: "Ошибка при обновлении аватара",
    UPDATE_PROFILE: "Ошибка при обновлении профиля",
    UNKNOWN_ERROR: "Неизвестная ошибка",
  },

  // Ошибки закладок
  BOOKMARKS: {
    ADD: "Ошибка при добавлении в закладки",
    REMOVE: "Ошибка при удалении из закладок",
  },

  // Ошибки истории чтения
  READING_HISTORY: {
    ADD: "Ошибка при добавлении в историю чтения",
    REMOVE: "Ошибка при удалении из истории чтения",
  },

  // Ошибки просмотров глав
  CHAPTER_VIEWS: {
    UPDATE: "Ошибка при обновлении просмотров глав",
  },

  // Ошибки Rate Limit
  RATE_LIMIT: {
    TITLE: "Слишком много запросов",
    DESCRIPTION: "Вы превысили лимит запросов к серверу.",
    SUBTITLE: "Пожалуйста, подождите перед следующим действием",
    MESSAGE: (seconds: number) =>
      seconds > 60
        ? `До возобновления доступа осталось ${Math.ceil(seconds / 60)} мин ${seconds % 60} сек`
        : `До возобновления доступа осталось ${seconds} сек`,
    TRY_AGAIN: "Обновить страницу",
    GO_HOME: "Вернуться на главную",
    INFO: "Это ограничение необходимо для защиты сервера от перегрузки и обеспечения стабильной работы для всех пользователей.",
  },

  // Общие ошибки
  COMMON: {
    NETWORK_ERROR: "Ошибка сети. Проверьте подключение к интернету",
    SERVER_ERROR: "Ошибка сервера. Попробуйте позже",
    UNAUTHORIZED: "Неавторизованный доступ",
    FORBIDDEN: "Доступ запрещен",
    NOT_FOUND: "Ресурс не найден",
    VALIDATION_ERROR: "Ошибка валидации данных",
  },
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type AuthErrorKey = keyof typeof ERROR_MESSAGES.AUTH;
export type BookmarkErrorKey = keyof typeof ERROR_MESSAGES.BOOKMARKS;
export type ReadingHistoryErrorKey = keyof typeof ERROR_MESSAGES.READING_HISTORY;
export type CommonErrorKey = keyof typeof ERROR_MESSAGES.COMMON;
