# Архитектура Tomilo Lib Client

Документ для быстрого понимания проекта и безопасного масштабирования.

## Слои приложения

```
┌─────────────────────────────────────────────────────────────────┐
│  app/           Маршруты, страницы (page.tsx), layout, API routes
│                 Только композиция: импорт widgets/shared, минимум логики
├─────────────────────────────────────────────────────────────────┤
│  widgets/       Крупные блоки страниц (header, home sections, title view)
│                 Композиция shared + вызов store/hooks
├─────────────────────────────────────────────────────────────────┤
│  shared/        Переиспользуемые фичи и UI (reader, browse, profile, modal)
│                 Компоненты + связанные хуки; не знают о маршрутах
├─────────────────────────────────────────────────────────────────┤
│  store/         Redux: slices (локальное состояние) + RTK Query (API)
│  hooks/         Глобальные хуки (useAuth, useModal, useSearch…)
│  lib/           Чистые утилиты (date, sanitize, image-optimizer)
│  types/         TypeScript-типы (единый источник правды для DTO)
│  constants/     Константы приложения
│  contexts/      React-контексты
│  guard/         Защита маршрутов (AuthGuard)
│  api/           Прямые fetch/API вызовы (если не через RTK Query)
└─────────────────────────────────────────────────────────────────┘
```

## Правила зависимостей (масштабирование)

| Откуда    | Можно импортировать                    | Нельзя |
|----------|----------------------------------------|--------|
| `app/`   | `@/widgets`, `@/shared`, `@/store`, `@/hooks`, `@/lib`, `@/types`, `@/guard` | Логику роутинга в shared/widgets |
| `widgets/` | `@/shared`, `@/store`, `@/hooks`, `@/lib`, `@/types` | `app/`, другие widgets (осторожно) |
| `shared/` | `@/store`, `@/hooks`, `@/lib`, `@/types`, другие shared | `app/`, `widgets/` |
| `store/`, `lib/`, `hooks/` | `@/types`, `@/lib` (lib — только lib) | `app/`, `shared/`, `widgets/` |

Импорты: используйте алиас `@/` (например `@/shared`, `@/store/api/titlesApi`).

## Данные и API

- **Серверный бэкенд**: все запросы к API идут через RTK Query в `store/api/*Api.ts`. Базовый запрос и reauth — `store/api/baseQueryWithReauth.ts`.
- **Типы запросов/ответов**: в `types/` (title, user, api, chapter и т.д.). API-модули импортируют типы оттуда, не дублируют.
- **Локальное состояние UI** (фильтры, модалки, форма поиска): Redux slices в `store/slices/`.
- **Добавление нового эндпоинта**: создать или дополнить файл в `store/api/`, зарегистрировать API в `store/rootReducer.ts` (см. ниже) — middleware подтянется автоматически.

## Store: кеш и слайсы

- **Кеш серверных данных**: RTK Query в `store/api/*Api.ts` кеширует ответы по ключу запроса (endpoint + аргументы). Повторные вызовы `useXQuery` с теми же аргументами не делают лишний запрос — используются данные из кеша. Срок хранения: `keepUnusedDataFor` (например 60 с в titlesApi, 300 с в notificationsApi).
- **Использование кеша**: компоненты получают данные через хуки RTK Query (`useSearchTitlesQuery`, `useGetChaptersByTitleQuery`, `useGetCommentsQuery` и т.д.). Данные не дублируются в слайсах.
- **Слайсы**: в приложении реально читается только **auth** (useSelector в useAuth). Остальные слайсы (titles, chapters, collections, comments, notifications, search, filter, readingHistory, bookmarks, userProfile) не заполняются и не читаются компонентами — список/профиль/история приходят из API (authApi, titlesApi, collectionsApi и т.д.). При добавлении новых фич предпочтительно опираться на RTK Query и не дублировать серверные данные в слайсах.

## Store: как добавлять новое

1. **Новый RTK Query API**: создать `store/api/exampleApi.ts`, затем в `store/rootReducer.ts` добавить импорт и запись в массив `apiList` — reducer и middleware подключатся автоматически.
2. **Новый slice**: создать `store/slices/exampleSlice.ts`, добавить в `store/rootReducer.ts` в объект `slices`.

Так вы не забудете подключить middleware при добавлении API.

## Структура папок (кратко)

- `src/app/` — Next.js App Router: страницы, layout, `api/*` — route handlers (proxy, push, auth, stats).
- `src/shared/` — по фичам/блокам: `reader/`, `browse/`, `profile/`, `modal/`, `ui/`. В каждой папке — компоненты и при необходимости свой `index.ts` (barrel).
- `src/widgets/` — сборка страниц: `home-page/`, `navigation/`, `title-view/` и т.д.
- Подробные соглашения по именованию и файлам — в [FILE_STRUCTURE.md](FILE_STRUCTURE.md).

## Что не делать при масштабировании

- Не дублировать типы: общие DTO только в `types/`.
- Не тащить логику маршрутов (pathname, router) в `shared/` — только в `app/` и при необходимости в `widgets/`.
- Не добавлять новый API в store вручную в трёх местах — только через `rootReducer.ts`.
- Не создавать глубокую вложенность в `shared/` (предпочтительно 1–2 уровня: например `shared/reader/ReaderControls.tsx`).

## Полезные точки входа

| Задача              | Где искать |
|---------------------|------------|
| Роуты и страницы    | `src/app/` |
| UI компоненты       | `src/shared/` (и `shared/ui/`) |
| Запросы к бэкенду   | `src/store/api/` |
| Типы (модели)       | `src/types/` |
| Утилиты             | `src/lib/` |
| Глобальные хуки     | `src/hooks/` |
| Защита маршрутов    | `src/guard/` |

Версия документа: 1.0. Обновляйте при изменении архитектуры.
