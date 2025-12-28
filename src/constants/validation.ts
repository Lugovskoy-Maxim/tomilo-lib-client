// Сообщения валидации форм

export const VALIDATION_MESSAGES = {
  // Email валидация
  EMAIL_REQUIRED: "Email обязателен",
  EMAIL_INVALID: "Неверный формат email",
  EMAIL_PLACEHOLDER: "email@domen.ru",

  // Пароль валидация
  PASSWORD_REQUIRED: "Пароль обязателен",
  PASSWORD_PLACEHOLDER: "Введите пароль",

  // Заголовок/название
  TITLE_REQUIRED: "Название обязательно для заполнения",
  TITLE_PLACEHOLDER: "Введите название",

  // Автор
  AUTHOR_REQUIRED: "Автор обязателен для заполнения",
  AUTHOR_PLACEHOLDER: "Введите автора",



  DESCRIPTION_REQUIRED: "Описание обязательно для заполнения",
  DESCRIPTION_PLACEHOLDER: "Введите описание",

  // Жанры
  GENRE_REQUIRED: "Выберите хотя бы один жанр",

  // Теги
  TAG_PLACEHOLDER: "Введите тег",
  ALT_NAME_PLACEHOLDER: "Введите альтернативное название",

  // Кнопки действий
  SAVE_CHANGES: "Сохранить изменения",
  ADD_TITLE: "Добавить тайтл",
  EDIT_TITLE: "Редактировать тайтл",
  SAVING: "Сохраняем...",
  ADDING: "Добавляем...",
  LOADING: "Загрузка...",
} as const;

export type ValidationMessageKey = keyof typeof VALIDATION_MESSAGES;
