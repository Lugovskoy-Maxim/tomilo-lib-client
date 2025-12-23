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
