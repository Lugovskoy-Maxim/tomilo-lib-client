# Статистика: структура ответов API и соответствие клиент ↔ сервер

## Базовый формат ответа сервера

Все эндпоинты возвращают **ApiResponseDto**: `{ success, data, timestamp?, path?, method? }`.  
Клиент получает этот объект в `result` RTK Query, т.е. фактические данные лежат в **`result.data`** (первый уровень — обёртка API).

---

## Эндпоинты и структура `data`

### GET /api/stats (обзор)

- **Сервер:** `data` = объект с полями: `totalTitles`, `totalChapters`, `totalUsers`, `totalCollections`, `totalViews`, `totalBookmarks`, `daily`, `weekly`, `monthly`, `popularTitles`, `popularChapters`, `activeUsersToday`, `newUsersThisMonth`, `totalRatings`, `averageRating`, `ongoingTitles`, `completedTitles`, опционально `history`.
- **Клиент:** `statsData?.data` — это и есть объект статистики (OverviewSection, ChartsSection).

### GET /api/stats/history?type=daily|monthly|yearly&days=&year=&month=

- **Сервер:** `data` = `{ type, data: array, total }` (StatsHistoryResponse).  
  Массив записей в **`data.data`** (второй уровень — поле `data` внутри ответа).
- **Клиент:** массив для истории — **`historyData.data.data.data`** (RTK `data` → ApiResponseDto `data` → объект `{ type, data, total }` → массив `data`).

### GET /api/stats/daily?date=YYYY-MM-DD

- **Сервер:** `data` = один объект дня (DailyStats): `date`, `newUsers`, `newTitles`, `newChapters`, `chaptersRead`, `titleViews`, `chapterViews` (нет поля `views`).
- **Клиент:** запись за день — **`dailyData.data.data`** или **`dailyData.data`**. В UI используется нормализация: `views = titleViews + chapterViews`.

### GET /api/stats/range?start=&end=  и  GET /api/stats/recent?days=

- **Сервер:** `data` = массив DailyStats (те же поля, что и для daily).
- **Клиент:** массив — **`rangeData.data.data`** или **`rangeData.data`**; то же для **`recentData`**. В таблице и графиках используется нормализация (views, дата в виде строки).

### GET /api/stats/monthly?year=&month=

- **Сервер:** `data` = один объект с полями: `year`, `month`, `totalNewUsers`, `totalNewTitles`, `totalNewChapters`, `totalChaptersRead`, `totalTitleViews`, `totalChapterViews`, …
- **Клиент:** **`monthlyData.data.data`** или **`monthlyData.data`**. Нормализация: `views = totalTitleViews + totalChapterViews`, `newUsers = totalNewUsers` и т.д.

### GET /api/stats/yearly?year=

- **Сервер:** `data` = `{ year, months[], yearlyTotals }`. Итоги за год в **`yearlyTotals`**.
- **Клиент:** **`yearlyData.data.data`** или **`yearlyData.data`**. Нормализация: для отображения используется объект с полями из `yearlyTotals` и `year` (views = totalTitleViews + totalChapterViews и т.д.).

### GET /api/stats/years

- **Сервер:** `data` = **массив чисел** `number[]` (например `[2024, 2023]`).
- **Клиент:** поддерживаются оба варианта: если **`availableYears.data`** — массив, используется он; иначе **`availableYears.data.years`** (на случай формата `{ years: number[] }`).

### POST /api/stats/record (и GET для совместимости)

- **Сервер:** GET возвращает `data` = объект записи дня; POST возвращает `data` = `{ success, message, date, recorded }`.
- **Клиент:** отправляет **POST**; ответ обрабатывается как ApiResponseDto&lt;RecordStatsResponse&gt;.

---

## Расхождения полей и нормализация на клиенте

| Контекст        | Сервер                    | Клиент (ожидание)   | Нормализация в UI |
|-----------------|---------------------------|---------------------|--------------------|
| Просмотры за день | `titleViews`, `chapterViews` | `views`             | `views = titleViews + chapterViews` |
| Дата            | `Date` (в JSON — строка)   | строка YYYY-MM-DD   | `date.toISOString().split('T')[0]` или как есть |
| Месяц           | `totalNewUsers`, `totalTitleViews`, … | `newUsers`, `views`, … | `normMonthly()` |
| Год             | `yearlyTotals.totalNewUsers`, … | `newUsers`, `views`, … | `normYearly()` |

В **StatsSection** используются функции **`normItem`**, **`normMonthly`**, **`normYearly`**, чтобы приводить ответы сервера к единому виду для таблиц, графиков и сводных карточек.

---

## Base URL

- Сервер: все маршруты под глобальным префиксом **`/api`** (например `/api/stats`, `/api/stats/history`).
- Клиент: **statsApi** использует `baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"`. Для доступа к API нужно задать **NEXT_PUBLIC_API_URL** с путём до бэкенда, включая `/api` (например `https://tomilo-lib.ru/api` или `http://localhost:3001/api`), иначе запросы пойдут на `/stats` без префикса и могут не попасть на контроллер.
