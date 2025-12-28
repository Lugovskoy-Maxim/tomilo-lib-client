// UI элементы интерфейса

export const UI_ELEMENTS = {
  // Основные кнопки и действия
  LOGIN: "Войти",
  REGISTER: "Зарегистрироваться", 
  FORGOT_PASSWORD: "Забыли пароль?",
  HIDE_PASSWORD: "Скрыть пароль",
  SHOW_PASSWORD: "Показать пароль",
  SAVE_CHANGES: "Сохранить изменения",
  ADD_TITLE: "Добавить тайтл",
  EDIT_TITLE: "Редактировать тайтл",
  NORMALIZE_GENRES: "Нормализовать жанры",
  NORMALIZE_TAGS: "Нормализовать теги",
  
  // Статусы загрузки
  LOADING: "Загрузка...",
  SAVING: "Сохраняем...",
  ADDING: "Добавляем...",
  
  // Разделители и служебные тексты
  OR: "или",

  ALREADY_HAVE_ACCOUNT: "Ещё нет аккаунта?",
  LOGIN_TITLE: "Вход в аккаунт",
  
  // Placeholder'ы
  EMAIL_PLACEHOLDER: "email@domen.ru",
  PASSWORD_PLACEHOLDER: "Введите пароль",
  TITLE_PLACEHOLDER: "Введите название",
  AUTHOR_PLACEHOLDER: "Введите автора",
  DESCRIPTION_PLACEHOLDER: "Введите описание",
  TAG_PLACEHOLDER: "Введите тег",
  ALT_NAME_PLACEHOLDER: "Введите альтернативное название",
  
  // Aria-labels для навигации
  ARIA_LABELS: {
    CATALOG: "Каталог",
    NOTIFICATIONS: "Уведомления",
    HOME_PAGE: "Главная страница", 
    BOOKMARKS: "Закладки",
    MENU: "Меню",
    SEARCH: "Поиск",
    SHOW_MORE: "Показать еще",
    CLOSE: "Закрыть",
    BACK: "Назад",
  },
  
  // Сообщения возрастной проверки
  AGE_VERIFICATION_CONTENT: "Содержимое этого раздела предназначено",
  AGE_CONFIRM_TEXT: "для лиц старше 18 лет",
  AGE_CONFIRM_BUTTON: "Мне есть 18 лет",
  AGE_DENY_BUTTON: "Мне нет 18 лет",
  
  // Подсказки
  CREATE_ACCOUNT_PROMPT: "Создайте аккаунт для сохранения прогресса",
  USE_FILTERS_PROMPT: "Используйте фильтры для поиска нужных тайтлов",
  ADD_BOOKMARKS_PROMPT: "Добавьте интересные тайтлы в закладки",
  
  // Админские тексты
  ADMIN_CREATE_TITLE: "Добавить новый тайтл",
  ADMIN_EDIT_TITLE: "Редактировать тайтл", 
  ADMIN_CREATE_DESCRIPTION: "Заполните информацию о тайтле",
  ADMIN_EDIT_DESCRIPTION: "Обновите информацию о тайтле",
  ADMIN_SELECT_GENRE: "Выберите жанр",
  ADMIN_TAG_SUGGESTIONS: "Начните вводить тег...",
  
  // Уведомления о результатах нормализации
  GENRES_NORMALIZED: (count: number, changesText: string, moreText: string) => 
    `Нормализовано ${count} жанров:\n${changesText}${moreText}`,
  TAGS_NORMALIZED: (count: number, changesText: string, moreText: string) => 
    `Нормализовано ${count} тегов:\n${changesText}${moreText}`,
  ALL_GENRES_NORMALIZED: "Все жанры уже в нормальном формате",
  ALL_TAGS_NORMALIZED: "Все теги уже в нормальном формате",
  
  // Сообщения для авторизации
  RESTORE_PASSWORD_REQUEST: "Запрос на восстановление пароля",
  TOKEN_MESSAGE: "Сообщение с токеном",
  ERROR_PROCESSING: "Обработка ошибки",
  VK_SUCCESS: "Успешная авторизация через VK",
  

  // Общие константы
  UNKNOWN_SLUG: "не указан",
  CHAPTER_FORMAT: (number: number, title?: string) => 
    `Глава ${number}${title ? ` - ${title}` : ""}`,
  YEAR_FORMAT: (year: number) => year.toString(),

  // Админские поля форм
  FIELD_LABELS: {
    NAME_REQUIRED: "Название *",
    NAME: "Название",
    SLUG: "Slug",
    AUTHOR_REQUIRED: "Автор *",
    AUTHOR: "Автор",
    ARTIST: "Художник",
    RELEASE_YEAR_REQUIRED: "Год выпуска *",
    RELEASE_YEAR: "Год выпуска",
    STATUS_REQUIRED: "Статус *",
    STATUS: "Статус",
    AGE_LIMIT: "Возрастное ограничение",
    TITLE_TYPE_REQUIRED: "Тип тайтла *",
    TITLE_TYPE: "Тип тайтла",
    PUBLISHER: "Издатель",
    SERIALIZATION: "Сериализация",
    ALT_NAMES: "Альтернативные названия",
    GENRES_REQUIRED: "Жанры *",
    GENRES: "Жанры",
    TAGS: "Теги",
    DESCRIPTION_REQUIRED: "Описание *",
    DESCRIPTION: "Описание",
    COVER: "Обложка",
    UPLOAD_COVER: "Загрузить обложку",
    DELETE: "Удалить",
    PREVIEW: "Предпросмотр",
    CANCEL: "Отмена",
  },

  // Валидационные сообщения
  VALIDATION: {
    YEAR_RANGE: (currentYear: number) => 
      `Должен быть между 1900 и ${currentYear}`,
    SELECTED_COUNT: (count: number, items: string[]) => 
      `Выбрано: ${items.join(', ')}`,
  },

  // Действия админки
  ADMIN_ACTIONS: {
    BASIC_INFO: "Основная информация",
    PUBLISHED: "Опубликовано",
    ADD: "Добавить",
    NORMALIZE: "Нормализовать",
    NORMALIZE_GENRES: "Нормализовать жанры",
    NORMALIZE_TAGS: "Нормализовать теги",
  },
} as const;

export type UIElementKey = keyof typeof UI_ELEMENTS;
export type AriaLabelKey = keyof typeof UI_ELEMENTS.ARIA_LABELS;
