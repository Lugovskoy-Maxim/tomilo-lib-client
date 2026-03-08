# 🌟 Tomilo Lib

[![Version](https://img.shields.io/badge/version-0.5.0-blue.svg)](https://github.com/tomilo/tomilo-lib-client)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4+-38B2AC)](https://tailwindcss.com/)

Веб-приложение для чтения манги и управления своей библиотекой. Современная платформа с удобным интерфейсом для любителей манги и комиксов.

![Tomilo Lib Preview](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Tomilo+Lib+Preview)

## ✨ Функции

### 🔐 Аутентификация и авторизация

- Регистрация и вход пользователей
- JWT-аутентификация с localStorage
- Защищенные маршруты

### 👤 Управление профилем

- Просмотр и редактирование личных данных
- История чтения и прогресс
- Персональные настройки

### 📚 Библиотека тайтлов

- Обширная коллекция манги и комиксов
- Продвинутый поиск и фильтрация
- Категории и коллекции по темам

### 🔖 Закладки

- Добавление тайтлов в закладки
- Организация по категориям
- Синхронизация между устройствами

### 📖 Чтение

- Комфортное чтение глав
- Отслеживание прогресса чтения
- История последних прочитанных
- Оптимизация изображений для быстрой загрузки

### 🛠 Административная панель

- Управление тайтлами и главами
- Модерация контента
- Статистика и аналитика

## 🛠 Технологии

### Frontend

- **Next.js 15.5.2+** - React фреймворк для веб-приложений
- **React 19.1.0** - Библиотека для создания пользовательских интерфейсов
- **TypeScript 5+** - Типизированный JavaScript
- **Tailwind CSS 4+** - Утилитарный CSS фреймворк

### State Management

- **Redux Toolkit** - Управление состоянием приложения
- **RTK Query** - API запросы и кеширование

### UI & Анимации

- **Lucide React** - Иконки
- **Framer Motion** - Анимации
- **Next Themes** - Темная/светлая тема

### Дополнительно

- **Socket.io Client** - Реальное время
- **Custom Components** - Кастомные UI компоненты

### Оптимизация изображений

- **Lazy Loading** - Ленивая загрузка изображений
- **Адаптивные изображения** - Оптимизация под разные размеры экранов
- **Сжатие изображений** - Автоматическое сжатие перед загрузкой

## 🚀 Установка и запуск

### Предварительные требования

- Node.js 18+
- npm или yarn

### Шаги установки

1. **Клонируйте репозиторий:**

   ```bash
   git clone https://github.com/tomilo/tomilo-lib-client.git
   cd tomilo-lib-client
   ```

2. **Установите зависимости:**

   ```bash
   npm install
   ```

3. **Запустите в режиме разработки:**

   ```bash
   npm run dev
   ```

4. **Откройте в браузере:**
   Перейдите на [http://localhost:3000](http://localhost:3000)

### Сборка для продакшена

```bash
npm run build
npm start
```

### Линтинг

```bash
npm run lint
```

### Проверка эндпоинтов API

Проверка доступности GET-эндпоинтов на сервере (используется `NEXT_PUBLIC_API_URL` из `.env`):

```bash
npm run check:api
```

Спецификация недостающих эндпоинтов для реализации на бэкенде: [docs/BACKEND_MISSING_ENDPOINTS.md](docs/BACKEND_MISSING_ENDPOINTS.md).

## 🤖 Telegram бот новых глав

Готовый шаблон находится в `scripts/telegram-chapters-bot.mjs`.

### 1) Подключите бота к существующему каналу

1. Создайте бота в `@BotFather` и получите токен.
2. Добавьте бота администратором в канал.
3. Выдайте право на публикацию сообщений.
4. Используйте `@channel_username` или `-100...` как `TELEGRAM_CHANNEL_ID`.

### 2) Настройте переменные окружения

Скопируйте значения из `.env.example` в `.env`:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=@your_channel
CHAPTER_SOURCE_URL=https://example.com/chapters.json
CHAPTER_SOURCE_TYPE=json
CHAPTER_JSON_ITEMS_PATH=data.items
CHAPTER_JSON_ID_KEY=id
CHAPTER_JSON_TITLE_KEY=title
CHAPTER_JSON_URL_KEY=url
CHAPTER_JSON_DATE_KEY=publishedAt
```

Для RSS:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=@your_channel
CHAPTER_SOURCE_URL=https://example.com/rss.xml
CHAPTER_SOURCE_TYPE=rss
```

### 3) Запустите бота

Однократная проверка:

```bash
npm run bot:chapters
```

Постоянный polling:

```env
CHAPTER_POLL_INTERVAL_SECONDS=300
```

После этого:

```bash
npm run bot:chapters
```

Бот хранит уже отправленные главы в `.cache/telegram-chapters-sent.json` и не отправляет дубликаты.

## 📖 Использование

### Для пользователей

1. Зарегистрируйтесь или войдите в аккаунт
2. Просматривайте популярные тайтлы на главной странице
3. Используйте поиск для нахождения интересующей манги
4. Добавляйте тайтлы в закладки
5. Читайте главы с удобным интерфейсом

### Для администраторов

1. Войдите под администраторским аккаунтом
2. Перейдите в админ-панель
3. Управляйте тайтлами, главами и пользователями

### Оптимизация изображений

Проект использует продвинутую систему оптимизации изображений для уменьшения нагрузки на сеть:

1. Ленивая загрузка изображений (lazy loading)
2. Адаптивные изображения под разные размеры экранов
3. Автоматическое сжатие изображений перед загрузкой
4. Использование современных форматов (WebP)

## 📁 Структура проекта

Исходный код находится в `src/`. Подробные соглашения по именованию и организации файлов — в [FILE_STRUCTURE.md](FILE_STRUCTURE.md).

```
src/
├── app/              # Next.js App Router: страницы, layout, API routes
│   ├── admin/        # Админ-панель
│   ├── auth/         # Вход, регистрация, восстановление пароля
│   ├── api/          # Route handlers (search, push, auth, stats и др.)
│   ├── titles/       # Каталог и карточки тайтлов
│   ├── profile/      # Свой профиль
│   ├── user/         # Публичные профили пользователей
│   └── ...
├── shared/           # Переиспользуемые UI и фичи (reader, comments, modal, browse)
├── widgets/          # Крупные блоки страниц (header, footer, carousel, home-page)
├── store/            # Redux: slices + RTK Query API
├── lib/              # Утилиты (date, sanitize, seo, image-optimizer и др.)
├── hooks/            # Кастомные React-хуки
├── types/            # TypeScript-типы
├── constants/        # Константы приложения
├── contexts/         # React-контексты
├── guard/            # Защита маршрутов (AuthGuard)
├── api/              # Прямые API-вызовы (не RTK)
└── ...
```

Статика: `public/` (логотипы, манифест PWA, изображения коллекций).

## 📚 Документация

| Документ                                                     | Описание                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [FILE_STRUCTURE.md](FILE_STRUCTURE.md)                       | Соглашения по структуре папок, именованию файлов и CSS       |
| [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md)   | Выполненные оптимизации и рекомендации по производительности |
| [docs/api-profile-deletion.md](docs/api-profile-deletion.md) | Спецификация API удаления профиля для бэкенда                |

## 📸 Скриншоты

### Главная страница

![Главная страница](https://via.placeholder.com/600x300/1F2937/FFFFFF?text=Главная+страница)

### Страница чтения

![Страница чтения](https://via.placeholder.com/600x300/374151/FFFFFF?text=Страница+чтения)

### Админ-панель

![Админ-панель](https://via.placeholder.com/600x300/111827/FFFFFF?text=Админ-панель)

## 📄 Лицензия

Этот проект является приватным и не имеет открытой лицензии.

## 📞 Контакты

- **Сайт:** [tomilo-lib.ru](https://tomilo-lib.ru)
- **Email:** support@tomilo-lib.ru
- **GitHub:** [Lugovskoy-Maxim](https://github.com/Lugovskoy-Maxim)

---

<div align="center">
  <p>
    <a href="#tomilo-lib">Наверх</a>
  </p>
</div>
