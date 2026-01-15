# Оптимизация изображений в проекте

## Обзор

В этом проекте реализована система оптимизации изображений для уменьшения нагрузки на сеть и улучшения производительности. Система включает в себя:

1. Утилиту оптимизации изображений (`src/lib/image-optimizer.ts`)
2. Компонент оптимизированного изображения (`src/shared/optimized-image.tsx`)
3. Lazy loading с помощью Intersection Observer
4. Адаптивные изображения с srcset

## Основные функции

### 1. Оптимизация изображений перед загрузкой

Функция `optimizeImage` позволяет сжимать изображения перед их загрузкой на сервер:

```typescript
import { optimizeImage } from '@/lib/image-optimizer';

const optimizedBlob = await optimizeImage(file, {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'webp'
});
```

### 2.Ленивая загрузка изображений

Класс `ImageLazyLoader` реализует lazy loading с помощью Intersection Observer:

```typescript
import { ImageLazyLoader } from '@/lib/image-optimizer';

const loader = new ImageLazyLoader();
loader.observe(imgElement, 'path/to/image.jpg');
```

### 3. React хук для управления состоянием изображения

Хук `useImageState` позволяет управлять состоянием загрузки изображений в компонентах:

```typescript
import { useImageState } from '@/lib/image-optimizer';

const MyComponent = () => {
  const { isLoading, isLoaded, error, loadImage } = useImageState();
  
  useEffect(() => {
    loadImage('path/to/image.jpg');
  }, []);
  
  // ...
};
```

### 4. Адаптивные изображения

Функции `generateSrcSet` и `selectImageSize` позволяют создавать адаптивные изображения:

```typescript
import { generateSrcSet, selectImageSize } from '@/lib/image-optimizer';

const srcSet = generateSrcSet('path/to/image.jpg');
const optimalSrc = selectImageSize('path/to/image.jpg', window.innerWidth);
```

## Использование компонента OptimizedImage

Компонент `OptimizedImage` объединяет все функции оптимизации:

```tsx
import { OptimizedImage } from '@/shared';

const MyComponent = () => (
  <OptimizedImage
    src="path/to/image.jpg"
    alt="Описание изображения"
    width={800}
    height={600}
    quality={80}
    priority={false}
    onLoad={() => console.log('Изображение загружено')}
    onError={() => console.log('Ошибка загрузки')}
  />
);
```

## Рекомендации по использованию

1. Используйте компонент `OptimizedImage` вместо стандартного `<img>` для всех изображений
2. Указывайте точные размеры изображений для лучшей производительности
3. Используйте атрибут `priority` для изображений above-the-fold
4. Оптимизируйте изображения перед загрузкой с помощью `optimizeImage`
5. Используйте формат WebP при возможности

## Настройка качества изображений

Рекомендуемые настройки качества:
- Обложки тайтлов: 85-90
- Изображения в галереях: 75-80
- Аватары пользователей: 80-85
- Фоновые изображения: 70-75

## Мониторинг производительности

Для мониторинга эффективности оптимизации изображений можно использовать:
1. Lighthouse Performance Score
2. PageSpeed Insights
3. Network tab в DevTools для анализа объема загружаемых данных