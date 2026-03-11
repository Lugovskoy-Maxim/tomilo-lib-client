# План оптимизации, устранения багов и реструктуризации Tomilo Lib

Единый документ: функции сайта, синхронизация клиент ↔ сервер, баги, оптимизации и поэтапная реструктуризация с сохранением функционала.

---

## 1. Сводка функций (клиент + сервер)

### 1.1 Клиент (tomilo-lib-client)

| Область | Функции | Маршруты / точки входа |
|--------|---------|-------------------------|
| **Каталог** | Просмотр тайтлов, фильтры (жанры, тип, сортировка), поиск, пагинация | `/titles`, `/titles/[slug]`, TitlesPage, TitleView |
| **Ридер** | Чтение глав (подряд/постранично), настройки ридера, закладка страницы, комментарии к главе, реакции, рейтинг главы | `/titles/[slug]/chapter/[chapterId]`, ReadChapterPage |
| **Профиль** | Профиль пользователя, закладки, история чтения, достижения, инвентарь, ежедневный бонус/квесты, настройки (приватность, тема, шрифты, уведомления, безопасность) | `/profile`, `/bookmarks`, `/history`, `/settings`, `/user/[username]` |
| **Коллекции** | Список коллекций, просмотр коллекции, добавление/удаление тайтлов | `/collections`, `/collections/[id]` |
| **Уведомления** | Список уведомлений, тосты в реальном времени (WebSocket), счётчик непрочитанных | `/notifications`, NotificationSocketToasts, NotificationButton |
| **Авторизация** | Логин, регистрация, OAuth (Яндекс, VK), восстановление пароля, верификация email | Модалки, `/verify-email`, `/reset-password`, API routes auth |
| **Подписки на тайтлы** | Подписка на новые главы тайтла | SubscribeButton, subscriptionsApi |
| **Комментарии** | Комментарии к тайтлу/главе, ответы, реакции | CommentsSection, commentsApi |
| **Жалобы** | Отправка жалобы на контент | ReportModal, reportsApi |
| **Топ и лидеры** | Топ тайтлов, таблица лидеров по опыту | `/top`, `/leaders` |
| **Обновления** | Лента последних обновлений глав | `/updates` |
| **Новости** | Список новостей, статья | `/news`, `/news/[slug]` |
| **Персонажи** | Каталог персонажей, карточка персонажа, предложение персонажа | `/characters`, `/characters/[id]`, `/titles/[slug]/characters` |
| **Переводчики** | Команды переводчиков, страница команды | `/translators/[slug]` |
| **Магазин** | Декоры (аватар, рамка, фон, карточка), покупка, экипировка | ShopSection, shopApi |
| **Промокоды** | Ввод и активация промокода | promocodesApi (в профиле/магазине) |
| **PWA** | Офлайн, «Добавить на главный экран», Push-подписка | ServiceWorkerRegistration, OfflineBanner, AddToHomeScreenBanner |
| **Статика** | О проекте, FAQ, авторские права, условия, политика, DMCA, контакт | `/about`, `/faq`, `/copyright`, `/terms-of-use`, `/privacy-policy`, `/dmca`, `/contact` |
| **Админка** | Дашборд, тайтлы/главы/пользователи, отчёты, очередь работ, парсер, настройки сайта, жанры, достижения, объявления, промокоды, аудит, боты, персонажи, магазин, авто-парсинг, IP, уведомления, комментарии | `/admin/*` |
| **Прочее** | RSS, ads.txt, статистика (API routes), cookie consent, Telegram-уведомление | `app/rss`, `app/ads.txt`, `app/api/stats/*` |

### 1.2 Сервер (tomilo-lib-server)

| Модуль | Назначение |
|--------|------------|
| **App** | Health, hello, stats (общая статистика) |
| **Auth** | Login, register, OAuth (Yandex, VK), refresh, verify-email, forgot/reset password, change password, link providers |
| **Users** | Профиль, закладки, история чтения, прогресс, аватар, настройки, push-subscribe, daily bonus/quests, leaderboard, удаление аккаунта; админ: пользователи, подозрительные/боты |
| **Titles** | CRUD тайтлов, поиск, фильтры, популярные, последние обновления, рейтинг, просмотры, похожие, коллекции (превью) |
| **Chapters** | CRUD глав, загрузка страниц, просмотры, рейтинг, реакции, next/prev, по тайтлу |
| **Search** | Полнотекстовый поиск, autocomplete |
| **Notifications** | Список, unread-count, mark read, delete; WebSocket: unread_count, progress, notification |
| **Collections** | CRUD коллекций, просмотры, тайтлы в коллекции, комментарии |
| **Comments** | CRUD комментариев, реакции (like/dislike, emoji) |
| **Reports** | Создание и модерация жалоб |
| **Subscriptions** | Подписка пользователя на тайтл (новые главы) |
| **Shop** | Декоры, покупка, экипировка; админ: CRUD декоров; крон: еженедельный выбор победителя предложений |
| **Achievements** | Админ: CRUD достижений, выдача/отзыв |
| **Announcements** | Публичный список/по slug; админ: CRUD, загрузка изображений |
| **Promocodes** | Проверка кода, активация; админ: CRUD, генерация, использование |
| **Stats** | Статистика (daily, monthly, yearly, range, record); крон: запись за предыдущий день |
| **Auto-parsing** | Очередь заданий авто-парсинга; крон: ежедневные/еженедельные/ежемесячные и по расписанию |
| **Manga-parser** | Парсинг метаданных, тайтла, глав, sync глав; WebSocket прогресса парсинга |
| **Translator-teams** | CRUD команд, участники, тайтлы, аватар |
| **Characters** | Список по тайтлу, CRUD, модерация предложений, загрузка изображений |
| **Genres** | Админ: CRUD жанров, merge |
| **Admin** | Дашборд, пользователи (ban/unban/role), тайтлы (bulk), комментарии, логи, экспорт, health, cache clear |
| **Files** | Админ: sync uploads, cleanup S3/orphans |
| **Email** | Регистрация, верификация, сброс пароля |
| **Push** | Web Push (отправка подписчикам) |
| **S3** | Работа с S3 (файлы) |

---

## 2. Матрица синхронизации клиент ↔ сервер

| Клиент (страница/фича) | Store API | Серверный эндпоинт/модуль | Заметки |
|------------------------|-----------|---------------------------|--------|
| Каталог, тайтл по slug | titlesApi | GET titles/slug/:slug, titles/* | Ок |
| Главы тайтла | chaptersApi | GET chapters/title/:titleId | Ок |
| Ридер, просмотр главы | chaptersApi, authApi (history) | GET chapters/:id, POST chapters/:id/view, POST users/profile/history/:titleId/:chapterId | Ок |
| Закладки | authApi (getBookmarks, addBookmark, …) | users/profile/bookmarks/* | Ок |
| История чтения | authApi (getHistory, addToHistory, …) | users/profile/history/* | Ок |
| Уведомления | notificationsApi + notificationsSocket | GET notifications/*, WS /api/notifications | Исправлено: массовые уведомления теперь шлют событие `notification` |
| Поиск | searchApi (autocomplete), legacy api/searchApi | GET search, GET search/autocomplete | Два пути поиска на клиенте — унифицировать |
| Профиль пользователя | usersApi, authApi | GET users/:id, GET users/profile | usersApi без reauth — при 401 не обновится токен |
| Лидерборд | leaderboardApi | users/leaderboard | leaderboardApi без reauth |
| Жанры | genresApi | genres (admin + public?) | genresApi без reauth |
| Достижения | achievementsApi | achievements/admin + выдача | achievementsApi без reauth |
| Настройки сайта | siteSettingsApi | site-settings | siteSettingsApi без reauth |
| Статистика (дашборд) | statsApi | stats/* | statsApi без reauth; админ-контекст |
| Аудит логи | auditLogsApi | admin/logs | auditLogsApi без reauth |
| IP | ipApi | ip (admin) | ipApi без reauth |
| Парсер (админ) | mangaParserApi | manga-parser/* | mangaParserApi без reauth |
| Авто-парсинг | autoParsingApi | auto-parsing/* | autoParsingApi без reauth |

---

## 3. Выявленные баги и несогласованности

### 3.1 Клиент

- **Опечатка в роуте**: `app/admin/titles/edit/[id]/chapters/[chatperId]` → должно быть `[chapterId]`.
- **Два способа поиска**: полнотекстовый поиск через legacy `src/api/searchApi.ts` (fetch), автодополнение через RTK `store/api/searchApi.ts`. Разная логика и возможные расхождения с бэкендом.
- **API без reauth**: `usersApi`, `leaderboardApi`, `genresApi`, `achievementsApi`, `siteSettingsApi`, `statsApi`, `auditLogsApi`, `ipApi`, `mangaParserApi`, `autoParsingApi` используют `fetchBaseQuery` без `baseQueryWithReauth`. При истечении токена 401 не приведёт к refresh и повтору запроса — возможны «вылеты» из админки или профиля.
- **Слайсы-зомби**: слайсы titles, chapters, collections, comments, notifications, readingHistory, bookmarks, userProfile, search, filter не являются источником правды (данные из RTK Query). Риск дублирования логики и путаницы при доработках.

### 3.2 Сервер

- **JWT secret**: хардкод `'your-super-secret-jwt-key'` при отсутствии `process.env.JWT_SECRET` в нескольких местах (auth, gateway). Нужен единый конфиг и отказ от дефолта в коде.
- **ParsingGateway**: монкей-патч методов MangaParserService для прогресса; при рефакторинге парсера легко сломать. Нужна явная абстракция (wrapper/strategy) для прогресса.
- **Reports**: модуль в `comments/reports.module.ts`, эндпоинты `/reports` — логически отдельная сущность; лучше вынести в `src/reports/`.
- **TitlesController**: роуты без префикса контроллера (корень), остальные модули с префиксом — единообразие и риск конфликтов с будущими корневыми путями.

### 3.3 Синхронизация клиент–сервер

- **Формат ответов**: клиент ожидает обёртку `{ data, ... }`; сервер должен стабильно возвращать единый формат (уже описан в API_ENDPOINTS.md).
- **WebSocket namespace**: клиент подключается к `NEXT_PUBLIC_API_URL/notifications` (без повторного `/api` в пути). Убедиться, что на сервере namespace совпадает (например `/api/notifications` при baseUrl с `/api`).

---

## 4. Оптимизации

### 4.1 Клиент

- **Единый baseQuery**: перевести все RTK Query API на `baseQueryWithReauth`, кроме намеренно публичных (например часть shop/genres). Добавить в `PUBLIC_ENDPOINTS` в baseQueryWithReauth только те эндпоинты, которые реально публичные.
- **Поиск**: один вход — RTK Query (searchApi). Полнотекстовый поиск перевести на эндпоинт в searchApi с тем же baseQuery; убрать вызовы из `src/api/searchApi.ts` или сделать его тонкой обёрткой над store.
- **Слайсы**: либо удалить неиспользуемые слайсы (titles, chapters, collections, comments, notifications, readingHistory, bookmarks, userProfile, search, filter), либо чётко описать их роль (только UI-состояние: фильтры, открытые модалки и т.д.) и не дублировать в них серверные данные.
- **Кеш RTK Query**: проверить `keepUnusedDataFor` и теги инвалидации по зонам (тайтлы, главы, профиль, уведомления), чтобы при действиях (добавление в закладки, прочтение главы) обновлялись нужные списки.
- **Инвалидация при WebSocket**: при получении события `notification` по сокету — инвалидировать тег списка уведомлений, чтобы страница `/notifications` подтягивала свежие данные без ручного обновления.

### 4.2 Сервер

- **Конфиг JWT**: вынести секрет в ConfigService/переменную окружения, один модуль конфигурации; в auth и gateway — только чтение конфига.
- **Единый префикс роутов**: ввести глобальный префикс (например `api`) для всех контроллеров, Titles привести к тому же правилу.
- **Parsing progress**: заменить монкей-патч на явный слой (сервис/интерфейс), который парсер вызывает для прогресса; gateway подписывается на этот слой.
- **Cron и фоновые задачи**: документировать все кроны (shop, auto-parsing, users deletion, files sync, stats) в одном месте (например в README или OPERATIONS.md). В перспективе — вынос тяжёлых задач в очередь (Bull) с retry и мониторингом.
- **Логирование**: унифицировать использование Nest Logger vs кастомный LoggerService.

---

## 5. Единая логика (принципы)

- **Один источник правды по данным**: сервер — БД; клиент — RTK Query кеш. Слайсы только для UI-состояния (фильтры, модалки, выбор вкладки).
- **Один способ вызова API на клиенте**: RTK Query + baseQueryWithReauth для всех авторизованных запросов; публичные эндпоинты — явный список в конфиге baseQuery.
- **Один способ поиска**: один API (searchApi) с эндпоинтами autocomplete и full search; один хук/компонент поиска.
- **Единый формат ответов API**: всегда `{ data?, success?, message?, errors? }`; типы в `types/` на клиенте соответствуют DTO сервера (при необходимости — общий репозиторий типов или генерация из OpenAPI).
- **Уведомления**: создание уведомления на сервере (одиночное или массовое) всегда сопровождается: записью в БД, обновлением unread_count по WebSocket, отправкой события `notification` по WebSocket (чтобы тосты и список были синхронны).
- **Авторизация**: везде один механизм (Bearer + refresh при 401); на клиенте — один baseQuery с reauth для защищённых запросов.

---

## 6. План реструктуризации (с сохранением функционала)

Реструктуризация — поэтапная, без «переписывания всего». Каждый этап завершается проверкой: существующий функционал работает.

### Фаза 1 — Критические баги и единообразие API (клиент) ✅

1. ✅ Исправить опечатку: `[chatperId]` → `[chapterId]` в пути админки.
2. ✅ Перевести на `baseQueryWithReauth`: usersApi, leaderboardApi, genresApi, achievementsApi, siteSettingsApi, statsApi, auditLogsApi, ipApi, mangaParserApi, autoParsingApi. Добавить в `PUBLIC_ENDPOINTS` только те эндпоинты, которые реально публичные (например getDecorations, getGenres для каталога).
3. ✅ Унифицировать поиск: перенести полнотекстовый поиск в RTK searchApi (эндпоинт getFullSearch), обновить useSearch (useLazyGetFullSearchQuery); legacy `api/searchApi.ts` помечен как @deprecated.

### Фаза 2 — Слайсы и кеш (клиент) ✅

4. ✅ Решить судьбу слайсов: проведён аудит — только `auth` читается (useAuth). Слайсы titles, collections, chapters, comments, notifications, userProfile, readingHistory, bookmarks, search, filter удалены из rootReducer и файлы удалены. Единственное использование (dispatch(updateTitle) в админке) заменено на titlesApi.util.invalidateTags.
5. Теги инвалидации: в authApi уже настроены invalidatesTags для закладок и истории (Bookmarks, ReadingHistory, Auth); при новом уведомлении по сокету — см. п. 6.
6. ✅ В NotificationSocketToasts при получении события `notification` вызывается invalidateTags(["Notifications", "UnreadCount"]).

### Фаза 3 — Сервер: конфиг и роуты ✅

7. ✅ JWT: единый источник — `src/config/jwt.config.ts` (getJwtSecret()). В production JWT_SECRET обязателен; в dev — dev-only дефолт. Подключено в AuthModule, JwtStrategy, NotificationsModule/Gateway, jwt.util, TitlesController.
8. ✅ TitlesController: добавлен префикс `@Controller('titles')`, пути методов без дублирования `titles/`. Клиент: исправлен путь `/titles/titles/recent` → `/titles/recent`.
9. ✅ Reports: вынесены в `src/reports/` (reports.module, controller, service, dto). Импорт в app.module обновлён; старые файлы в `comments/` удалены.

### Фаза 4 — Сервер: парсер и очереди ✅

10. ✅ Parsing progress: введён интерфейс `IParsingProgressReporter` (dto/parsing-progress.dto.ts). MangaParserService принимает опциональный `options?.reporter` в `parseAndImportTitle` и `parseAndImportChapters`, вызывает `reporter.report(...)` на каждом этапе. ParsingGateway создаёт репортер через `createReporter(sessionId)` и передаёт в сервис — монкей-патч удалён.
11. ✅ Документировать все cron-задачи в одном файле: создан `tomilo-lib-server/docs/CRON_AND_JOBS.md` (Shop, Auto-parsing, Users, Files, Stats).
12. ✅ Парсинг нескольких тайтлов: добавлен тип `batch_import` в ParsingProgressDto и обработчик WebSocket `parse_batch` (массив ParseTitleDto). Сообщения: «Тайтл N из M», название текущего тайтла, прогресс по главам внутри тайтла.

### Фаза 5 — Документация и типы ✅

12. ✅ Обновить ARCHITECTURE.md и FILE_STRUCTURE.md: решение по слайсам (только auth), единый baseQuery, единый поиск (RTK searchApi), устаревший api/ — отражено.
13. При необходимости: описать контракт API (OpenAPI/Swagger на сервере) и при желании генерировать типы клиента из него — оставлено на будущее.

### Фаза 6 — Дополнительно (по возможности)

14. Общий репозиторий типов (пакет или подмодуль) для DTO — по желанию.
15. E2E-тесты на критические сценарии — по желанию.

---

## 7. Чек-лист перед каждым релизом

- [ ] Все защищённые запросы с клиента идут через baseQueryWithReauth.
- [ ] Поиск выполняется только через RTK searchApi (без legacy fetch).
- [ ] На сервере при создании уведомлений (в т.ч. массовых) вызывается emitNotificationToUser / аналог.
- [ ] JWT secret задаётся только через env, без дефолта в коде.
- [ ] Роут админки глав: `[chapterId]`, не `[chatperId]`.
- [ ] Документация (ARCHITECTURE.md, FILE_STRUCTURE.md, API_ENDPOINTS.md) актуальна.

---

Версия документа: 1.0. Обновляйте при изменении плана или появлении новых функций.
