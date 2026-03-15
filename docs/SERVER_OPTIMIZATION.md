# Оптимизация работы с сервером

Документ описывает текущую логику запросов к API и меры по снижению нагрузки на сервер для стабильности и масштабирования (главная, страница тайтла, страница чтения). Изменения не ломают текущий функционал.

**Прод API:** `https://tomilo-lib.ru/api`  
**Код сервера:** `/Users/tomilo/Documents/GitHub/tomilo-lib-server`

---

## 1. Текущая логика запросов

### 1.1 Главная страница

| Источник | Запросы | Когда |
|----------|---------|--------|
| `useAuth` | `GET /users/profile`, `GET /users/profile/history?limit=200` | При наличии токена (при монтировании/фокусе) |
| `useHomeData` | `GET /titles/popular`, `GET /titles/recent`, `GET /titles/random`, `GET /titles/search` (underrated, top x3) | При появлении секций в viewport; кеш 10 мин |
| `useGetLatestUpdatesQuery` | `GET /titles/latest-updates` | При монтировании и при возврате фокуса на вкладку |
| `ContinueReadingSection` | `GET /users/profile/history?limit=50` | Отдельный запрос при авторизации — **дублирует** историю из useAuth |
| `useStaticData` | `GET /collections` (и при необходимости latest-updates) | При появлении секции |

Итого для авторизованного пользователя: минимум 2 запроса истории (limit=200 и limit=50), профиль, несколько блоков тайтлов, последние обновления.

### 1.2 Страница тайтла (`/titles/[slug]`)

| Источник | Запросы | Когда |
|----------|---------|--------|
| SSR (generateMetadata + page) | `GET /titles/slug/:slug?populateChapters=false` | Для SEO и JSON-LD; данные **не передаются** клиенту |
| `TitleView` | `GET /titles/slug/:slug?includeChapters=true`, `GET /chapters/title/:titleId` | При монтировании клиента |
| `useAuth` | профиль + история (если уже загружены — из кеша) | При монтировании |
| `RightContent` | `GET /users/profile/history/:titleId/read-ids`, `GET /titles/:id/stats`, `GET /titles/:id/my-rating`, `GET /users/profile/progress/:titleId` | При наличии titleId/user |
| `TitleView` | `POST /titles/:id/views` | Один раз при открытии страницы |

История по тайтлу уже есть в `user.readingHistory` (из useAuth), но дополнительно запрашивается лёгкий эндпоинт read-ids для статуса «прочитано» у глав.

### 1.3 Страница чтения (`/titles/[slug]/chapter/[chapterId]`)

| Источник | Запросы | Когда |
|----------|---------|--------|
| SSR | `GET /titles/slug/:slug`, `GET /chapters/:id` | Метаданные и данные для ServerChapterPage |
| Клиент | `useAuth` (профиль, история) | При монтировании |
| `ReadChapterPage` | `POST /users/profile/history/:titleId/:chapterId` (addToReadingHistory) | При открытии/прокрутке до главы |
| После addToReadingHistory | `refetchProfile()`, `refetchReadingHistory()` | Сразу после успешного POST — **два лишних GET на каждую прочитанную главу** |
| Клиент | `POST /chapters/:id/view` | Учёт просмотра главы |
| При переходе на следующую главу | `GET /chapters/:id` (lazy) | По требованию |

Итого: на каждую открытую главу — 1 POST истории + 2 GET (профиль + история) только ради обновления UI.

---

## 2. Где хранятся данные (RTK и слайсы)

- **Профиль и история чтения:** в RTK Query (authApi: getProfile, getReadingHistory) и синхронизируются в **authSlice** (`user`, в т.ч. `user.readingHistory`) и в localStorage (`tomilo_lib_user`). Использование: useAuth(), continueReading, закладки, «продолжить чтение».
- **Тайтлы и главы:** только в кеше RTK Query (titlesApi, chaptersApi). Слайсов для них нет.
- **Кеш RTK:** `keepUnusedDataFor` в titlesApi 60 с, в useHomeData для главной — 600 с; у authApi для getReadingHistory отдельно не задан (дефолт 60 с).

Идея: максимально опираться на уже загруженные данные в RTK и в authSlice, реже дергать сервер.

---

## 3. Рекомендуемые изменения (без смены функционала)

### 3.1 История чтения — один источник на главной

- **Проблема:** на главной два запроса истории: useAuth (limit=200) и ContinueReadingSection (limit=50).
- **Решение:** блок «Продолжить чтение» брать данные из useAuth: передавать в секцию `continueReading` (или `user.readingHistory`) и показывать первые 50 записей. Запрос `useGetReadingHistoryQuery({ limit: 50 })` в ContinueReadingSection выполнять только если данных из useAuth ещё нет (например, скелетон), либо не вызывать его при авторизации вообще — один общий запрос истории (useAuth, limit=200) покрывает и блок «Продолжить чтение».

**Эффект:** минус 1 GET /users/profile/history на каждый заход на главную для авторизованных.

### 3.2 Страница тайтла — read-ids не пропускать

- **Почему не пропускаем:** список истории `GET /users/profile/history` может приходить в light-формате (одна последняя глава на тайтл). Для отображения всех прочитанных глав (зелёные иконки) нужен полный список ID — его даёт только `GET /users/profile/history/:titleId/read-ids`. Поэтому запрос read-ids на странице тайтла оставляем всегда при наличии user и titleId.

### 3.3 Добавление в историю чтения — без лишних refetch

- **Проблема:** после каждого успешного `addToReadingHistory` вызываются refetchProfile() и refetchReadingHistory() — два GET на каждую прочитанную главу.
- **Решение:**
  1. **Оптимистичное обновление:** после успешного POST обновлять `authSlice` (updateUser): добавить/обновить запись в `user.readingHistory` для данного titleId/chapterId (merge по главам и readAt), чтобы UI сразу показывал актуальное состояние без refetch.
  2. **Обновление из ответа:** в ответе addToReadingHistory сервер может отдавать фрагмент пользователя (level, experience, balance). Если есть — вызывать updateUser с этими полями, не refetchProfile.
  3. **Не вызывать** refetchProfile и refetchReadingHistory сразу после addToReadingHistory. Инвалидация тегов (ReadingHistory, Auth) уже есть в мутации — подписанные компоненты обновятся при следующем обращении к этим данным.

**Эффект:** минус 2 GET на каждую открытую главу при чтении.

### 3.4 Кеш и частота refetch

- **Главная:** для `useGetLatestUpdatesQuery` не делать refetch при каждом фокусе вкладки; использовать тот же подход, что и для остальных блоков главной: например `refetchOnMountOrArgChange: 600`, `refetchOnFocus: false` (или большой интервал), чтобы не увеличивать пики при переключении вкладок.
- **Тайтл и главы:** увеличить `keepUnusedDataFor` для getTitleBySlug и getChaptersByTitle (например 5–10 минут), чтобы при возврате на страницу тайтла реже ходить на сервер. На сервере уже стоят Cache-Control для slug и списков.

**Эффект:** меньше повторных запросов при навигации и переключении вкладок.

### 3.5 (Опционально) Передача данных со SSR на клиент

- **Страница тайтла:** при SSR уже запрашивается getTitleDataBySlug(slug). Эти данные можно передавать в TitleView как initialData для useGetTitleBySlugQuery, чтобы первый рендер клиента не делал повторный GET. Требует согласования формата (slug vs includeChapters) и аккуратности с гидратацией.
- **Страница главы:** аналогично, данные из ServerChapterPage уже есть — клиент может использовать их как начальные, не запрашивая главу повторно при монтировании.

Это даёт дополнительное снижение запросов при первом открытии страницы.

---

## 4. Что хранить в RTK / слайсах (итог)

- **Уже хранится:** профиль и история чтения в authSlice + RTK authApi; тайтлы и главы только в RTK Query.
- **Рекомендуется сохранить:** один общий запрос истории (например limit=200 в useAuth) как источник правды для главной, страницы тайтла и читалки; после addToReadingHistory обновлять чтение из ответа/оптимистично в authSlice, не дергать лишние GET.
- **Не дублировать:** не запрашивать отдельно history?limit=50 для «Продолжить чтение». Запрос read-ids по тайтлу оставляем (без него зелёные иконки «прочитано» не работают — список истории может быть в light-формате).

---

## 5. Краткая сводка по запросам

| Сценарий | Было | Стало (после оптимизаций) |
|----------|------|----------------------------|
| Главная (авторизован) | 2× GET history + профиль + блоки + latest-updates | 1× GET history + профиль + блоки + latest-updates (реже refetch) |
| Страница тайтла (авторизован) | GET slug, GET chapters, GET read-ids, GET stats, my-rating, progress, POST views | Без GET read-ids при наличии истории по тайтлу в user |
| Открытие одной главы (авторизован) | POST history, GET profile, GET history | POST history + обновление из ответа/оптимистично в сторе, без немедленных GET |

В сумме это значительно снижает количество запросов на пользователя при сохранении текущего поведения интерфейса.
