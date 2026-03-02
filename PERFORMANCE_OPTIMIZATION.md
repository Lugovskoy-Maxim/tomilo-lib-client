# Рекомендации по оптимизации производительности

## Выполненные оптимизации

### 1. Мемоизация данных в useHomeData
- Все трансформации данных (`.map()`, `.filter()`, `.sort()`) обернуты в `useMemo()`
- Это предотвращает пересоздание массивов при каждом рендере

### 2. Устранение дублирования запросов в useStaticData
- Добавлен `collectionsLoadedRef` для предотвращения повторной загрузки коллекций
- Добавлен `lastIncludeAdultRef` для отслеживания изменения фильтра
- Добавлен AbortController для отмены запросов при unmount

### 3. Оптимизация компонентов HomePage
- `DataCarousel` обернут в `React.memo()` с типизированным интерфейсом
- Удален дублирующий вызов `useGetProfileQuery` (уже вызывается в `useAuth`)
- Добавлен `useMemo` для данных `TopCombinedSection`

### 4. Исправление утечки памяти в Carousel
- Добавлена очистка `autoScrollResumeTimeoutRef` при unmount

### 5. Оптимизация OptimizedImage компонента ✅
- Переписан с использованием `next/image` вместо нативного `<img>`
- Автоматическая конвертация в WebP/AVIF (экономия 30-50% трафика)
- Генерация responsive `srcset` для разных размеров экрана
- Сохранена поддержка fallback chains, error handling, lazy loading
- Добавлен параметр `sizes` для оптимального выбора размера изображения
- Добавлена автоматическая детекция внешних URL для `unoptimized` режима

### 6. Добавлен Bundle Analyzer ✅
- Установлен `@next/bundle-analyzer`
- Добавлена команда `npm run analyze` для анализа размера бандла

---

## Рекомендации к внедрению

### Высокий приоритет

#### 1. Исправление LeaderCard — замена raw `<img>` тегов

**Проблема:** 6+ raw `<img>` тегов без lazy loading и оптимизации.

**Файл:** `src/shared/leader-card/LeaderCard.tsx`

**Решение:** Заменить на `OptimizedImage` или `next/image`.

#### 2. Замена CSS backgroundImage на Image компонент

**Проблема:** CSS `backgroundImage` в `TitleView.tsx` загружает полноразмерное изображение для блюра.

**Файл:** `src/widgets/title-view/TitleView.tsx` (строка ~259)

**Решение:** 
```tsx
// Вместо CSS background-image
<div className="relative w-full h-96">
  <Image
    src={coverUrl}
    alt=""
    fill
    className="object-cover blur-2xl opacity-30"
    sizes="100vw"
    quality={20} // Низкое качество для блюра достаточно
    priority={false}
  />
</div>
```

---

### Средний приоритет

#### 3. Code Splitting для RTK Query API слайсов

**Проблема:** 21 API slice включаются в middleware, увеличивая bundle size.

**Решение:** Использовать dynamic imports для редко используемых API.

```tsx
// Ленивая загрузка API для админки
const adminApis = [
  auditLogsApi,
  autoParsingApi,
  mangaParserApi,
  reportsApi,
];

// В store/index.ts — подключать только базовые API
export const store = configureStore({
  reducer: {
    // Базовые API для всех пользователей
    [authApi.reducerPath]: authApi.reducer,
    [titlesApi.reducerPath]: titlesApi.reducer,
    [chaptersApi.reducerPath]: chaptersApi.reducer,
    // Остальные подключаются динамически
  },
  middleware: (getDefault) => getDefault().concat(
    authApi.middleware,
    titlesApi.middleware,
    chaptersApi.middleware,
  ),
});

// Динамическое добавление middleware при входе в админку
export const injectAdminApis = () => {
  adminApis.forEach(api => {
    store.injectEndpoints(api.endpoints);
  });
};
```

#### 4. Prefetch критичных данных

**Проблема:** Популярные тайтлы загружаются только после mount и IntersectionObserver.

**Решение:** Использовать React Server Components или prefetch для критичных данных.

```tsx
// src/app/page.tsx — Server Component
import { headers } from 'next/headers';

async function getPopularTitles() {
  const res = await fetch(`${process.env.API_URL}/titles/popular?limit=20`, {
    next: { revalidate: 300 } // ISR 5 минут
  });
  return res.json();
}

export default async function Page() {
  const popularTitles = await getPopularTitles();
  
  return <HomePage initialPopularTitles={popularTitles.data} />;
}
```

---

### Низкий приоритет

#### 5. Оптимизация шрифтов

**Текущее состояние:** 5 локальных шрифтов с `display: "swap"` — хорошо.

**Улучшение:** Добавить `preload` для критичных вариантов:

```tsx
// В layout.tsx
<link
  rel="preload"
  href="/fonts/Exo2-cyrillic.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

#### 6. Оптимизация третьесторонних скриптов

**Проблема:** Yandex Metrika и Google Analytics загружаются с `beforeInteractive` / `afterInteractive`.

**Улучшение:** 
- Yandex Metrika можно загружать после `load` события
- Использовать Partytown для вынесения в web worker

```tsx
import Script from 'next/script';

<Script
  src="https://mc.yandex.ru/metrika/tag.js"
  strategy="lazyOnload" // Загружать после load
/>
```

#### 7. Добавление Service Worker для кеширования

```tsx
// public/sw.js
const CACHE_NAME = 'tomilo-lib-v1';
const STATIC_ASSETS = [
  '/fonts/Exo2-cyrillic.woff2',
  '/fonts/Exo2-latin.woff2',
  // ... другие шрифты
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});
```

---

## Метрики для отслеживания

### Core Web Vitals целевые значения

| Метрика | Текущее* | Цель | Как измерить |
|---------|----------|------|--------------|
| LCP (Largest Contentful Paint) | - | < 2.5s | Lighthouse, PageSpeed Insights |
| FID (First Input Delay) | - | < 100ms | Web Vitals JS |
| CLS (Cumulative Layout Shift) | - | < 0.1 | Lighthouse |
| TTFB (Time to First Byte) | - | < 600ms | DevTools Network |

*Измерить после внедрения изменений

### Как измерить:

```bash
# Lighthouse в CI
npm install -D lighthouse
npx lighthouse https://tomilo-lib.ru --output json --output-path ./lighthouse-report.json

# Bundle size
npm run build
# Смотреть .next/analyze/* после добавления bundle-analyzer
```

---

## Чеклист внедрения

- [x] Обновить OptimizedImage на next/image ✅
- [x] Добавить bundle-analyzer ✅
- [ ] Исправить LeaderCard (raw img → OptimizedImage)
- [ ] Заменить CSS backgroundImage в TitleView
- [ ] Измерить текущие Core Web Vitals (запустить `npm run analyze`)
- [ ] Настроить prefetch для популярных тайтлов
- [ ] Оптимизировать загрузку аналитики
- [ ] Рассмотреть code splitting для админских API
