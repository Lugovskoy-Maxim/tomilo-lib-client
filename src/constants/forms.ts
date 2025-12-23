// Константы текстов форм

export const FORM_MESSAGES = {
  // Поля форм
  FIELDS: {
    EMAIL: "Email",
    PASSWORD: "Пароль",
    USERNAME: "Имя пользователя",
    CONFIRM_PASSWORD: "Подтвердите пароль",
    BIO: "О себе",
    TITLE: "Название",
    DESCRIPTION: "Описание",
    GENRE: "Жанр",
    STATUS: "Статус",
    AUTHOR: "Автор",
    ARTIST: "Художник",
    RELEASE_YEAR: "Год выпуска",
    AGE_LIMIT: "Возрастное ограничение",
    COVER_IMAGE: "Обложка",
    TAGS: "Теги",
    CHAPTER_TITLE: "Название главы",
    CHAPTER_NUMBER: "Номер главы",
    CHAPTER_CONTENT: "Содержимое главы",
    URL: "Ссылка",
    SEARCH: "Поиск",
    SORT_BY: "Сортировать по",
    SORT_ORDER: "Порядок сортировки",
  },

  // Подсказки и плейсхолдеры
  PLACEHOLDERS: {
    EMAIL: "Введите ваш email",
    PASSWORD: "Введите пароль",
    USERNAME: "Введите имя пользователя",
    BIO: "Расскажите о себе...",
    TITLE: "Введите название",
    DESCRIPTION: "Введите описание",
    AUTHOR: "Введите имя автора",
    ARTIST: "Введите имя художника",
    RELEASE_YEAR: "Введите год выпуска",
    TAGS: "Введите теги через запятую",
    CHAPTER_TITLE: "Введите название главы",
    CHAPTER_NUMBER: "Введите номер главы",
    SEARCH: "Поиск...",
    URL: "Введите ссылку",
  },

  // Сообщения валидации
  VALIDATION: {
    REQUIRED: "Это поле обязательно для заполнения",
    EMAIL_INVALID: "Введите корректный email адрес",
    PASSWORD_TOO_SHORT: "Пароль должен содержать минимум 6 символов",
    PASSWORDS_DONT_MATCH: "Пароли не совпадают",
    USERNAME_TOO_SHORT: "Имя пользователя должно содержать минимум 3 символа",
    USERNAME_TAKEN: "Это имя пользователя уже занято",
    EMAIL_TAKEN: "Этот email уже зарегистрирован",
    TITLE_TOO_SHORT: "Название должно содержать минимум 2 символа",
    DESCRIPTION_TOO_SHORT: "Описание должно содержать минимум 10 символов",
    INVALID_NUMBER: "Введите корректное число",
    YEAR_OUT_OF_RANGE: "Год должен быть в диапазоне от 1900 до текущего",
    URL_INVALID: "Введите корректную ссылку",
    FILE_TOO_LARGE: "Размер файла не должен превышать 5 МБ",
    FILE_TYPE_INVALID: "Поддерживаются только изображения формата JPG, PNG, GIF",
  },

  // Кнопки
  BUTTONS: {
    SUBMIT: "Отправить",
    SAVE: "Сохранить",
    CANCEL: "Отмена",
    RESET: "Сбросить",
    DELETE: "Удалить",
    EDIT: "Редактировать",
    ADD: "Добавить",
    UPDATE: "Обновить",
    LOGIN: "Войти",
    REGISTER: "Зарегистрироваться",
    LOGOUT: "Выйти",
    UPLOAD: "Загрузить",
    SEARCH: "Поиск",
    FILTER: "Фильтровать",
    SORT: "Сортировать",
    LOAD_MORE: "Загрузить еще",
    SHOW_MORE: "Показать больше",
    SHOW_LESS: "Показать меньше",
  },

  // Сообщения об успехе
  SUCCESS: {
    SAVED: "Данные успешно сохранены",
    UPDATED: "Данные успешно обновлены",
    DELETED: "Элемент успешно удален",
    ADDED: "Элемент успешно добавлен",
    REGISTERED: "Регистрация успешно завершена",
    LOGGED_IN: "Вход выполнен успешно",
    LOGGED_OUT: "Выход выполнен успешно",
    PROFILE_UPDATED: "Профиль успешно обновлен",
    AVATAR_UPDATED: "Аватар успешно обновлен",
    BOOKMARK_ADDED: "Добавлено в закладки",
    BOOKMARK_REMOVED: "Удалено из закладок",
    CHAPTER_UPDATED: "Глава успешно обновлена",
    TITLE_CREATED: "Тайтл успешно создан",
  },

  // Сообщения об ошибках форм
  FORM_ERRORS: {
    SUBMISSION_FAILED: "Ошибка при отправке формы. Попробуйте снова",
    VALIDATION_FAILED: "Проверьте правильность заполнения полей",
    NETWORK_ERROR: "Ошибка сети. Проверьте подключение к интернету",
    SERVER_ERROR: "Ошибка сервера. Попробуйте позже",
    UNAUTHORIZED: "Неавторизованный доступ. Войдите в систему",
    FORBIDDEN: "У вас нет прав для выполнения этого действия",
    NOT_FOUND: "Запрашиваемый ресурс не найден",
    DUPLICATE_ENTRY: "Такая запись уже существует",
    INVALID_DATA: "Некорректные данные",
    FILE_UPLOAD_ERROR: "Ошибка при загрузке файла",
    FORM_NOT_COMPLETE: "Заполните все обязательные поля",
  },

  // Подтверждения
  CONFIRMATIONS: {
    DELETE_ITEM: "Вы уверены, что хотите удалить этот элемент?",
    DELETE_PERMANENTLY: "Это действие нельзя отменить. Продолжить?",
    LEAVE_PAGE: "У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?",
    RESET_FORM: "Вы уверены, что хотите сбросить все поля формы?",
    LOGOUT: "Вы уверены, что хотите выйти из системы?",
    CANCEL_CHANGES: "У вас есть несохраненные изменения. Все изменения будут потеряны. Продолжить?",
  },
} as const;

// Типы для удобства использования
export type FormMessageKey = keyof typeof FORM_MESSAGES;
export type FieldMessageKey = keyof typeof FORM_MESSAGES.FIELDS;
export type ValidationMessageKey = keyof typeof FORM_MESSAGES.VALIDATION;
export type ButtonMessageKey = keyof typeof FORM_MESSAGES.BUTTONS;
export type SuccessMessageKey = keyof typeof FORM_MESSAGES.SUCCESS;
export type FormErrorMessageKey = keyof typeof FORM_MESSAGES.FORM_ERRORS;
export type ConfirmationMessageKey = keyof typeof FORM_MESSAGES.CONFIRMATIONS;
