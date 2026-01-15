# Соглашения по структуре и именованию файлов

## Общие правила именования

### PascalCase
Используется для:
- Компонентов React
- Классов и интерфейсов TypeScript
- Типов и перечислений

```
Button.tsx
UserProfile.tsx
TitleCard.tsx
ApiResponse.ts
```

### camelCase
Используется для:
- Утилит и вспомогательных функций
- Хуков
- Контекстов
- Сторов/слайсов

```
formatDate.ts
useAuth.ts
ToastContext.tsx
```

### kebab-case
Используется для:
- Папок страниц и роутов
- Динамических сегментов

```
titles/[slug]/
collections/[id]/
admin/titles/edit/[id]/
```

### SCREAMING_SNAKE_CASE
Используется для:
- Констант
- Конфигурационных файлов

```
API_URL.ts
MAX_PAGE_SIZE.ts
```

---

## Структура папок

```
src/
├── api/              # API запросы и axios/fetch обёртки
├── app/              # Next.js App Router страницы
│   ├── [route]/      # Динамические роуты
│   └── page.tsx      # Главные страницы
├── components/       # Глобальные переиспользуемые компоненты
├── constants/        # Константы приложения
├── contexts/         # React контексты
├── guard/            # Защитные компоненты (auth guard)
├── hooks/            # Кастомные хуки
├── lib/              # Утилиты и вспомогательные функции
├── shared/           # Общие компоненты (shared across app)
├── store/            # Redux store и слайсы
├── types/            # TypeScript типы
└── widgets/          # Комплексные виджеты/страницы
```

---

## Правила организации файлов

### index.ts для баррел-экспортов

Каждая папка должна иметь `index.ts` для удобного экспорта:

```typescript
// src/shared/button/index.ts
export { default as Button } from "./button";
export { default as ButtonGroup } from "./button-group";

// src/lib/index.ts
export { formatDate } from "./date-utils";
export { generateSlug } from "./string-utils";
```

### Сложные компоненты

Для компонентов с логикой и стилями:

```
src/shared/modal/
├── modal.tsx           # Основной компонент
├── modal-header.tsx    # Header компонента
├── modal-body.tsx      # Body компонента
├── modal-footer.tsx    # Footer компонента
├── index.ts            # Баррел-экспорт
└── useModal.ts         # Связанный хук (если нужен)
```

### Страницы Next.js

```
src/app/titles/[slug]/
├── page.tsx            # Главная страница (Server Component)
├── layout.tsx          # Layout для этого роута (опционально)
└── loading.tsx         # Loading UI (опционально)
```

---

## Именование файлов в разных директориях

### src/app/
```
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
[slug]/page.tsx
[...catchall]/page.tsx
```

### src/shared/
```
button.tsx / button/
card.tsx / card/
modal.tsx / modal/
```

### src/lib/
```
date-utils.ts
api-client.ts
validators.ts
```

### src/hooks/
```
useAuth.ts
useLocalStorage.ts
useDebounce.ts
```

### src/types/
```
api.ts
user.ts
title.ts
```

---

## Именование CSS классов (Tailwind)

Используем BEM-подобный подход с утилитами:

```tsx
// ✅ Хорошо
<div className="modal modal--open modal--large">
  <button className="modal__close-btn">
    <span className="modal__icon">×</span>
  </button>
</div>

// ❌ Плохо
<div className="my-modal open-large-close">
  <button className="close-button-red">
    <span className="icon">×</span>
  </button>
</div>
```

### Префиксы для модификаторов
- `--open`, `--closed` - состояния
- `--large`, `--small` - размеры
- `--primary`, `--secondary` - варианты

---

## Примеры

### Компонент кнопки
```
src/shared/button/
├── button.tsx
├── button.types.ts
├── button.module.css (если нужен custom CSS)
└── index.ts
```

### API модуль
```
src/api/
├── auth.ts
├── titles.ts
├── chapters.ts
├── search.ts
└── index.ts
```

### Страница тайтла
```
src/app/titles/[slug]/
├── page.tsx          # Server Component
├── loading.tsx
└── error.tsx
```

---

## Форматирование

### Prettier
Проект использует Prettier для автоматического форматирования.

Команды:
```bash
npm run format        # Форматировать все файлы
npm run format:check  # Проверить форматирование
```

### VSCode (рекомендуемые настройки)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "prettier.configPath": ".prettierrc"
}
```

