"use client";
import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  User,
  Bell,
  Shield,
  Eye,
  Settings,
  Coins,
  Trophy,
  Mail,
  Send,
} from "lucide-react";
import { Header, Footer } from "@/widgets";
import { Breadcrumbs } from "@/shared";

interface FAQItem {
  question: string;
  answer: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FAQSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FAQItem[];
}

const FAQ_DATA: FAQSection[] = [
  {
    title: "Чтение",
    icon: BookOpen,
    items: [
      {
        question: "Как изменить режим чтения?",
        answer:
          "Перейдите в настройки профиля → Чтение. Там можно выбрать режим отображения страниц: «По одной» (листание) или «Прокрутка» (непрерывная лента). Также можно настроить ориентацию экрана и ширину изображений.",
      },
      {
        question: "Что такое «Чтение глав подряд»?",
        answer:
          "При включении этой опции, когда вы дочитываете главу до конца или прокручиваете к началу, следующая или предыдущая глава автоматически подгружается. Адрес в строке браузера обновляется на текущую главу.",
      },
      {
        question: "Как изменить ширину страниц в читалке?",
        answer:
          "В настройках чтения есть ползунок «Ширина изображений» с диапазоном от 768 до 1440 пикселей. Выберите комфортный размер и нажмите «Сохранить».",
      },
      {
        question: "Сохраняется ли прогресс чтения?",
        answer:
          "Да, прогресс чтения сохраняется автоматически. Вы можете продолжить чтение с того места, где остановились, через раздел «История» или карточку тайтла.",
      },
    ],
  },
  {
    title: "Профиль и аккаунт",
    icon: User,
    items: [
      {
        question: "Как изменить аватар?",
        answer:
          "Нажмите на аватар в профиле и выберите «Изменить аватар». Поддерживаются изображения в форматах JPG, PNG и WebP. Максимальный размер файла — 5 МБ.",
      },
      {
        question: "Что такое ранг и как его повысить?",
        answer:
          "Ранг отражает вашу активность на платформе. Он повышается по мере набора опыта (EXP). Опыт начисляется за чтение глав, ежедневные бонусы и достижения. Чем выше ранг, тем больше привилегий.",
      },
      {
        question: "Как сменить пароль?",
        answer:
          "Перейдите в настройки профиля → Безопасность. Введите текущий пароль, затем новый пароль дважды и нажмите «Изменить пароль».",
      },
      {
        question: "Как удалить аккаунт?",
        answer:
          "Для удаления аккаунта свяжитесь с нами через форму обратной связи или напишите на support@tomilo-lib.ru. Укажите email, привязанный к аккаунту.",
      },
    ],
  },
  {
    title: "Уведомления",
    icon: Bell,
    items: [
      {
        question: "Какие уведомления можно настроить?",
        answer:
          "В настройках профиля → Уведомления можно включить или отключить: уведомления о новых главах в избранном, уведомления об ответах и упоминаниях в комментариях, персональные рекомендации.",
      },
      {
        question: "Как отключить все уведомления?",
        answer:
          "Перейдите в настройки уведомлений и отключите все переключатели. Уведомления о системных событиях (например, безопасность аккаунта) отключить нельзя.",
      },
    ],
  },
  {
    title: "Приватность",
    icon: Shield,
    items: [
      {
        question: "Кто может видеть мой профиль?",
        answer:
          "По умолчанию профиль публичный. В настройках приватности можно выбрать: «Публично» (все пользователи), «Друзья» (только добавленные друзья) или «Приватно» (только вы).",
      },
      {
        question: "Что видят другие пользователи на моей странице?",
        answer:
          "Всегда видно: имя, аватар, роль, уровень, ранг, дата регистрации, описание (био), любимый жанр и контакты (если указаны). Всегда скрыто: баланс монет, email, дата последнего входа, привязанные соцсети.",
      },
      {
        question: "Как скрыть статистику и достижения?",
        answer:
          "В настройках приватности есть переключатели для каждого раздела: статистика, достижения, история чтения, закладки. Отключите нужные пункты. При скрытии статистики вы также исключаетесь из таблицы лидеров.",
      },
    ],
  },
  {
    title: "Контент и отображение",
    icon: Eye,
    items: [
      {
        question: "Как включить отображение контента 18+?",
        answer:
          "Перейдите в настройки профиля → Контент и включите переключатель «18+ контент». Эта настройка доступна только для подтверждённых совершеннолетних пользователей.",
      },
      {
        question: "Как сменить тему оформления?",
        answer:
          "В настройках профиля → Тема оформления выберите: Светлая, Тёмная или Системная (автоматически подстраивается под настройки вашего устройства).",
      },
      {
        question: "Как изменить размер шрифта?",
        answer:
          "В настройках профиля есть раздел «Шрифт», где можно выбрать размер текста для интерфейса сайта.",
      },
    ],
  },
  {
    title: "Монеты и достижения",
    icon: Coins,
    items: [
      {
        question: "Как заработать монеты?",
        answer:
          "Монеты можно получить: за ежедневный бонус при входе, за выполнение достижений, за активность на сайте (чтение, комментарии), через специальные акции и события.",
      },
      {
        question: "На что можно потратить монеты?",
        answer:
          "Монеты используются в магазине для покупки особых аватаров, рамок профиля и других косметических предметов. Следите за обновлениями магазина!",
      },
      {
        question: "Как получить достижения?",
        answer:
          "Достижения выдаются за различные действия: прочитать определённое количество глав, добавить тайтлы в закладки, оставить комментарии и многое другое. Полный список достижений можно посмотреть в профиле.",
      },
    ],
  },
  {
    title: "Общие вопросы",
    icon: Settings,
    items: [
      {
        question: "Как добавить тайтл в закладки?",
        answer:
          "На странице тайтла нажмите кнопку «В закладки» и выберите папку (Читаю, Буду читать, Прочитано и т.д.). Закладки доступны в разделе «Закладки» в меню.",
      },
      {
        question: "Как работает поиск?",
        answer:
          "Поиск ищет по названию тайтла на русском, английском и оригинальном языке. Также можно использовать фильтры по жанрам, типу, статусу и году выпуска в каталоге.",
      },
      {
        question: "Почему некоторые главы недоступны?",
        answer:
          "Некоторые главы могут быть временно недоступны из-за технических работ или по запросу правообладателей. Если глава долго недоступна, сообщите нам через форму обратной связи.",
      },
      {
        question: "Как сообщить об ошибке или проблеме?",
        answer:
          "Напишите нам на support@tomilo-lib.ru или в Telegram-канал. Опишите проблему как можно подробнее: что делали, какой браузер использовали, приложите скриншот если возможно.",
      },
    ],
  },
];

function FAQAccordion({ section }: { section: FAQSection }) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const Icon = section.icon;

  return (
    <div className="content-card">
      <h2 className="content-card-section-title">
        <Icon className="w-5 h-5" />
        {section.title}
      </h2>
      <div className="space-y-2">
        {section.items.map((item, index) => {
          const isOpen = openItems.includes(index);
          return (
            <div
              key={index}
              className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--accent)]/50 transition-colors"
              >
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {item.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 animate-fade-in">
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FAQPageClient() {
  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
      <Header />
      <div className="w-full mx-auto px-2 min-[360px]:px-3 py-3 sm:px-4 sm:py-6 max-w-6xl min-w-0 overflow-x-hidden pb-12 sm:pb-16">
        <Breadcrumbs className="mb-6" />
        <div className="content-page-hero">
          <h1 className="flex items-center justify-center gap-3">
            <HelpCircle className="w-8 h-8" />
            Частые вопросы
          </h1>
          <p>
            Ответы на популярные вопросы о работе платформы, настройках профиля,
            чтении и других функциях сервиса.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {FAQ_DATA.map((section) => (
            <FAQAccordion key={section.title} section={section} />
          ))}

          <section className="content-card lg:col-span-2">
            <h2 className="content-card-section-title">
              <Trophy className="w-5 h-5" />
              Не нашли ответ?
            </h2>
            <p className="content-card-body">
              Если вы не нашли ответ на свой вопрос, свяжитесь с нами любым удобным
              способом. Мы постараемся ответить как можно скорее.
            </p>
            <div className="content-link-group">
              <Link href="mailto:support@tomilo-lib.ru" className="content-link-primary">
                <Mail className="w-4 h-4" />
                support@tomilo-lib.ru
              </Link>
              <Link
                href="https://t.me/tomilolib"
                target="_blank"
                rel="noopener noreferrer"
                className="content-link-primary"
              >
                <Send className="w-4 h-4" />
                Telegram-канал
              </Link>
              <Link href="/contact" className="content-link-outline">
                Страница контактов
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
