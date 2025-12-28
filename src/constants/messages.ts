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

  // Валидация форм
  VALIDATION: {
    EMAIL_REQUIRED: "Email обязателен",
    EMAIL_INVALID: "Неверный формат email",
    PASSWORD_REQUIRED: "Пароль обязателен",
    TITLE_REQUIRED: "Название обязательно для заполнения",
    AUTHOR_REQUIRED: "Автор обязателен для заполнения",
    DESCRIPTION_REQUIRED: "Описание обязательно для заполнения",
    GENRE_REQUIRED: "Выберите хотя бы один жанр",
  },

  // Сообщения об ошибках

  ERROR_MESSAGES: {
    LOGIN_ERROR: "Произошла ошибка при входе",
    INVALID_CREDENTIALS: "Неверные учетные данные",
    SERVER_ERROR: "Ошибка на сервере",
    NETWORK_ERROR: "Ошибка соединения с сервером",
    SERVER_NOT_FOUND: "Сервер не найден или endpoint недоступен",
    UNKNOWN_ERROR: "Произошла неизвестная ошибка",
    TITLE_LOAD_ERROR: "Ошибка загрузки тайтла",
    TITLE_NOT_FOUND: "Тайтл не найден",
    AUTHORIZATION_ERROR: "Ошибка авторизации через Яндекс",
    VK_AUTH_ERROR: "Ошибка VK авторизации",
    TOKEN_EXCHANGE_ERROR: "Ошибка обмена кода VK",
    VK_INIT_ERROR: "Ошибка инициализации VKID",
    YEAR_VALIDATION: (currentYear: number) => `Год выпуска должен быть между 1900 и ${currentYear}`,
  },

  // Типы контента
  CONTENT_TYPES: {
    MANGA: "Манга",
    MANHWA: "Манхва", 
    MANHUA: "Маньхуа",
    NOVEL: "Ранобэ",
    LIGHT_NOVEL: "Лайт-новелла",
    COMIC: "Комикс",
    OTHER: "Другое",
    UNSPECIFIED: "Неуказан",
    NO_TITLE: "Без названия",
  },

  // Элементы интерфейса
  UI_ELEMENTS: {
    LOGIN: "Войти",
    REGISTER: "Зарегистрироваться",
    FORGOT_PASSWORD: "Забыли пароль?",
    LOADING: "Загрузка...",
    SAVING: "Сохраняем...",
    ADDING: "Добавляем...",
    ADD_TITLE: "Добавить тайтл",
    HIDE_PASSWORD: "Скрыть пароль",
    SHOW_PASSWORD: "Показать пароль",
    OR: "или",
    ALREADY_HAVE_ACCOUNT: "Ещё нет аккаунта?",
    PASSWORD_PLACEHOLDER: "Введите пароль",
    EMAIL_PLACEHOLDER: "email@domen.ru",
    AGE_VERIFICATION_CONTENT: "Содержимое этого раздела предназначено",
    LOGIN_TITLE: "Вход в аккаунт",
    // Aria-labels
    ARIA_LABELS: {
      CATALOG: "Каталог",
      NOTIFICATIONS: "Уведомления", 
      HOME_PAGE: "Главная страница",
      BOOKMARKS: "Закладки",
      MENU: "Меню",
      SEARCH: "Поиск",
    },
  },

  // Жанры для админки
  GENRES: [
    "Фэнтези",
    "Романтика", 
    "Приключения",
    "Драма",
    "Комедия",
    "Боевик",
    "Детектив",
    "Ужасы",
    "Научная фантастика",
    "Повседневность",
    "Психологическое",
    "Исторический",
    "Спокон",
    "Гарем",
    "Исекай",
    "Махва",
    "Манхва",
    "Сёнэн",
    "Сёдзе",
    "Сейнен",
    "Жестокий мир",
    "Драконы",
    "Главная героиня",
    "Дружба",
    "Игровые элементы",
    "Мурим",
    "Всесильный главный герой",
    "Разумные расы",
    "Видеоигры",
  ],



  // Возрастные ограничения
  AGE_LIMITS: {
    ALL_AGES: "0+ Для всех возрастов",
    PLUS_12: "12+ Для детей старше 12",
    PLUS_16: "16+ Для детей старше 16", 
    PLUS_18: "18+ Только для взрослых",
  },

  // Placeholder'ы и подсказки
  PLACEHOLDERS: {
    SLUG: "Введите slug тайтла",
    ALT_NAME: "Введите альтернативное название", 
    TAG: "Введите тег",
    DESCRIPTION: "Подробное описание тайтла...",
    YEAR_HINT: (currentYear: number) => `Должен быть между 1900 и ${currentYear}`,
    YEAR_RANGE: (currentYear: number) => `1900-${currentYear}`,
  },


  // Кнопки и действия в админке
  ADMIN_ACTIONS: {
    COVER_UPLOAD: "Выбрать файл",
    DELETE: "Удалить",
    NORMALIZE: "Нормализовать",
    ADD: "Добавить",
    CANCEL: "Отмена",
    BASIC_INFO: "Основная информация",
    PUBLISHED: "Опубликован",
    COVER: "Обложка",
    SAVING: "Сохраняем...",
    SAVING_CHANGES: "Сохранить изменения",
    ADDING: "Добавляем...",
    ADD_TITLE: "Добавить тайтл",
    SELECTED: "Выбрано:",
  },

  // Контекстные сообщения
  CONTEXT: {
    COLLECTION: "Коллекция",
    COLLECTION_CREATED: "Создано:",
    NO_COLLECTION_DESCRIPTION: "Просмотрите коллекцию тайтлов",
    COLLECTION_KEYWORDS: "коллекция, тайтлы, манга",
    SEARCH_COLLECTIONS: (query: string) => `Поиск коллекций: ${query}`,
    SEARCH_COLLECTIONS_DESCRIPTION: (query: string) => `Найдите коллекции по запросу: ${query}`,
    ALL_COLLECTIONS_DESCRIPTION: "Просмотрите все доступные коллекции тайтлов",
    COLLECTIONS_KEYWORDS: "коллекции, тайтлы, манга, коллекция",
    IMPORTANT_INFO: "Важная информация",
    IMPORTANT_INFO_EN: "Important Information",
    RESTORE_PASSWORD_REQUEST: "Запрос на восстановление пароля",
    TOKEN_MESSAGE: "Сообщение с токеном",
    ERROR_PROCESSING: "Обработка ошибки",
    VK_SUCCESS: "Успешная авторизация через VK",
    AGE_CONFIRMED: "Возраст подтвержден",
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

export type ValidationKey = keyof typeof MESSAGES.VALIDATION;
export type ErrorMessageKey = keyof typeof MESSAGES.ERROR_MESSAGES;
export type ContentTypeKey = keyof typeof MESSAGES.CONTENT_TYPES;
export type UIElementKey = keyof typeof MESSAGES.UI_ELEMENTS;
export type AriaLabelKey = keyof typeof MESSAGES.UI_ELEMENTS.ARIA_LABELS;
export type ContextKey = keyof typeof MESSAGES.CONTEXT;
export type AgeLimitKey = keyof typeof MESSAGES.AGE_LIMITS;
export type PlaceholderKey = keyof typeof MESSAGES.PLACEHOLDERS;
export type AdminActionKey = keyof typeof MESSAGES.ADMIN_ACTIONS;
