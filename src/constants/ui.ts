// Константы UI текстов

export const UI_MESSAGES = {
  // Фильтры
  FILTERS: {
    TITLE: "Фильтры",
    RESET_ALL: "Сбросить все",
    GENRES: "Жанры",
    TYPE: "Тип",
    STATUS: "Статус",
    AGE_LIMITS: "Возрастные ограничения",
    RELEASE_YEARS: "Годы выпуска",
    TAGS: "Теги",
    FOR_ALL: "Для всех",
  },

  // Читатель
  READER: {
    AUTO: "Авто",
    FIT_WIDTH: "По ширине",
    ORIGINAL: "Оригинал",
    CHAPTER: "Глава",
  },

  // Навигация
  NAVIGATION: {
    BACK: "Назад",
    NEXT: "Далее",
    PREVIOUS: "Предыдущая",
    LOADING: "Загрузка...",
    LOADING_MORE: "Загрузка дополнительных данных...",
    NO_DATA: "Нет данных",
    NO_RESULTS: "Результатов не найдено",
  },

  // Общие UI элементы
  COMMON: {
    SEARCH: "Поиск",
    CLOSE: "Закрыть",
    OPEN: "Открыть",
    SAVE: "Сохранить",
    CANCEL: "Отмена",
    DELETE: "Удалить",
    EDIT: "Редактировать",
    ADD: "Добавить",
    REMOVE: "Удалить",
    CONFIRM: "Подтвердить",
    YES: "Да",
    NO: "Нет",
    OK: "ОК",
  },

  // Статусы
  STATUS: {
    ACTIVE: "Активный",
    INACTIVE: "Неактивный",
    PUBLISHED: "Опубликован",
    DRAFT: "Черновик",
    COMPLETED: "Завершен",
    ONGOING: "Продолжается",
    CANCELLED: "Отменен",
  },

  // Типы контента
  CONTENT_TYPES: {
    MANGA: "Манга",
    MANHWA: "Манхва",
    MANHUA: "Маньхуа",
    COMIC: "Комикс",
    NOVEL: "Новелла",
    WEBTOON: "Вебтон",
  },
} as const;

export type UIMessageKey = keyof typeof UI_MESSAGES;
export type FilterMessageKey = keyof typeof UI_MESSAGES.FILTERS;
export type ReaderMessageKey = keyof typeof UI_MESSAGES.READER;
export type CommonMessageKey = keyof typeof UI_MESSAGES.COMMON;
export type StatusMessageKey = keyof typeof UI_MESSAGES.STATUS;
export type ContentTypeMessageKey = keyof typeof UI_MESSAGES.CONTENT_TYPES;
