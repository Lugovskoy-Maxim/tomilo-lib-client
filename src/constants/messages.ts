// Основные константы сообщений

export const MESSAGES = {
  // Заголовки страниц
  PAGE_TITLES: {
    PROFILE: "Профиль пользователя",
    HOME: "Главная страница",
    BROWSE: "Каталог тайтлов",
    BOOKMARKS: "Мои закладки",
    HISTORY: "История чтения",
    ABOUT: "О нас",
    CONTACT: "Контакты",
    TERMS: "Условия использования",
    COPYRIGHT: "Правообладателям",
    SETTINGS: "Настройки",
    NOTIFICATIONS: "Уведомления",
  },

  // Навигация
  NAVIGATION: {
    HOME: "Главная",
    BROWSE: "Каталог",
    TITLES: "Тайтлы",
    COLLECTIONS: "Подборки",
    TOP: "Топ",
    UPDATES: "Обновления",
    BOOKMARKS: "Закладки",
    HISTORY: "История",
    PROFILE: "Профиль",
    ADMIN: "Админка",
  },

  // Действия
  ACTIONS: {
    VIEW: "Посмотреть",
    READ: "Читать",
    ADD_TO_BOOKMARKS: "Добавить в закладки",
    REMOVE_FROM_BOOKMARKS: "Удалить из закладок",
    CONTINUE_READING: "Продолжить чтение",
    START_READING: "Начать чтение",
    SHARE: "Поделиться",
    RATE: "Оценить",
    COMMENT: "Комментировать",
    FOLLOW: "Подписаться",
    UNFOLLOW: "Отписаться",
  },

  // Статусы контента
  CONTENT_STATUS: {
    ONGOING: "Продолжается",
    COMPLETED: "Завершен",
    CANCELLED: "Отменен",
    ON_HIATUS: "На паузе",
    DRAFT: "Черновик",
    PUBLISHED: "Опубликован",
  },

  // Информационные сообщения
  INFO: {
    NO_DATA: "Данные отсутствуют",
    NO_RESULTS: "Результатов не найдено",
    LOADING: "Загрузка...",
    LOADING_ERROR: "Ошибка загрузки",
    NETWORK_ERROR: "Ошибка сети",
    ACCESS_DENIED: "Доступ запрещен",
    UNAUTHORIZED: "Требуется авторизация",
    FEATURE_DISABLED: "Функция отключена",
    COMING_SOON: "Скоро...",
    MAINTENANCE: "На техническом обслуживании",
  },

  // Подсказки и советы
  TIPS: {
    USE_FILTERS: "Используйте фильтры для поиска нужных тайтлов",
    ADD_BOOKMARKS: "Добавьте интересные тайтлы в закладки",
    TRACK_READING: "Отслеживайте прогресс чтения в истории",
    USE_SEARCH: "Используйте поиск для быстрого поиска",
    CREATE_ACCOUNT: "Создайте аккаунт для сохранения прогресса",
    CHECK_UPDATES: "Проверяйте обновления любимых тайтлов",
  },

  // Временные сообщения
  TIME: {
    JUST_NOW: "Только что",
    MINUTES_AGO: (n: number) => `${n} мин. назад`,
    HOURS_AGO: (n: number) => `${n} ч. назад`,
    DAYS_AGO: (n: number) => `${n} дн. назад`,
    WEEKS_AGO: (n: number) => `${n} нед. назад`,
    MONTHS_AGO: (n: number) => `${n} мес. назад`,
    YEARS_AGO: (n: number) => `${n} г. назад`,
  },

  // Числовые форматы
  FORMATS: {
    VIEWS: (n: number) => `${n.toLocaleString()} просмотров`,
    RATING: (n: number) => `${n.toFixed(1)}/5`,
    CHAPTERS: (n: number) => `${n} глав`,
    FOLLOWERS: (n: number) => `${n} подписчиков`,
    COMMENTS: (n: number) => `${n} комментариев`,
  },

  // Уведомления
  NOTIFICATIONS: {
    NEW_CHAPTER: "Новая глава доступна",
    BOOKMARK_ADDED: "Добавлено в закладки",
    BOOKMARK_REMOVED: "Удалено из закладок",
    PROFILE_UPDATED: "Профиль обновлен",
    SETTINGS_SAVED: "Настройки сохранены",
    DATA_SYNCED: "Данные синхронизированы",
  },

  // Подтверждения действий
  CONFIRMATIONS: {
    DELETE_BOOKMARK: "Удалить из закладок?",
    CLEAR_HISTORY: "Очистить историю чтения?",
    LEAVE_PAGE: "Покинуть страницу?",
    LOGOUT: "Выйти из системы?",
    DELETE_ACCOUNT: "Удалить аккаунт?",
  },
} as const;

// Типы для удобства использования
export type MessageKey = keyof typeof MESSAGES;
export type PageTitleKey = keyof typeof MESSAGES.PAGE_TITLES;
export type NavigationKey = keyof typeof MESSAGES.NAVIGATION;
export type ActionKey = keyof typeof MESSAGES.ACTIONS;
export type ContentStatusKey = keyof typeof MESSAGES.CONTENT_STATUS;
export type InfoKey = keyof typeof MESSAGES.INFO;
export type TipKey = keyof typeof MESSAGES.TIPS;
export type NotificationKey = keyof typeof MESSAGES.NOTIFICATIONS;
export type ConfirmationKey = keyof typeof MESSAGES.CONFIRMATIONS;
