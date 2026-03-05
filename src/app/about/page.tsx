import { Metadata } from "next";
import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { Header, Footer } from "@/widgets";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import BackButton from "@/shared/back-button/BackButton";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";

const LAST_UPDATED = "Последнее обновление: 06.03.2025";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "О нас — о платформе Tomilo-lib для чтения манги | Tomilo-lib.ru",
    description:
      "Tomilo-lib — современная платформа для чтения манги, манхвы и маньхуа онлайн. Узнайте о нашей миссии, возможностях и планах развития.",
    keywords:
      "о нас, о платформе, Tomilo-lib, манга онлайн, читать мангу, миссия, команда, развитие платформы",
    canonicalUrl: `${baseUrl}/about`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — о нас",
    type: "website",
  });
}

const aboutBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "О нас", item: `${baseUrl}/about` },
  ],
};

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  mainEntity: {
    "@type": "Organization",
    name: "Tomilo-lib.ru",
    url: baseUrl,
    description:
      "Tomilo-lib — современная платформа для чтения манги, манхвы и маньхуа онлайн бесплатно.",
    foundingDate: "2024",
    sameAs: ["https://t.me/tomilolib", "https://t.me/TomiloDev"],
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutBreadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />
      <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
        <Header />
        <div className="w-full mx-auto px-2 min-[360px]:px-3 py-3 sm:px-4 sm:py-6 max-w-6xl min-w-0 overflow-x-hidden pb-12 sm:pb-16">
        <Breadcrumbs className="mb-6" />
        <div className="content-card mb-6">
          <div className="text-sm text-[var(--muted-foreground)]">{LAST_UPDATED}</div>
        </div>
        <div className="content-page-hero mb-10">
          <h1>О платформе TOMILO-LIB</h1>
          <p>
            Tomilo-lib — бесплатная платформа для чтения манги, манхвы и маньхуа онлайн. Удобный
            каталог, персональный профиль, автоматическое сохранение прогресса и навигация на любых
            устройствах.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="content-card">
            <h2 className="content-card-section-title">Наша миссия</h2>
            <p className="content-card-body">
              Делать чтение максимально простым и приятным: без лишних шагов, с аккуратным
              интерфейсом и фокусом на самом важном — ваших любимых тайтлах. Мы заботимся о
              скорости загрузки и удобстве читалки.
            </p>
          </section>

          <section className="content-card">
            <h2 className="content-card-section-title">Для кого платформа</h2>
            <p className="content-card-body">
              Для тех, кто только знакомится с мангой и манхвой, и для опытных читателей: быстрый
              поиск новинок, закладки, уведомления о новых главах и продолжение чтения с того же
              места на любом устройстве.
            </p>
          </section>

          <section className="content-card">
            <h2 className="content-card-section-title">Что уже доступно</h2>
            <ul className="content-card-body space-y-1">
              <li>Каталог с фильтрами по жанрам, году, статусу и поиском по названию</li>
              <li>Подборки и лента новых глав на главной странице</li>
              <li>Закладки (Читаю, Буду читать, Прочитано и др.) и история чтения</li>
              <li>Профиль с рангами, достижениями и настройками приватности</li>
              <li>Режимы чтения: по одной странице или непрерывная прокрутка</li>
              <li>Светлая, тёмная и системная тема оформления</li>
            </ul>
          </section>

          <section className="content-card">
            <h2 className="content-card-section-title">Как мы развиваемся</h2>
            <p className="content-card-body">
              Мы регулярно обновляем интерфейс, оптимизируем производительность и учитываем обратную
              связь. Главная, каталог, профиль и сервисные страницы развиваются как единая
              экосистема. Ваши предложения можно отправлять через страницу контактов.
            </p>
          </section>

          <section className="content-card lg:col-span-2">
            <h2 className="content-card-section-title">
              <Mail className="w-5 h-5" />
              Связь с командой
            </h2>
            <p className="content-card-body">
              Вопросы, идеи и замечания по работе платформы можно отправить на почту или в
              Telegram. Мы читаем все обращения и стараемся ответить в течение 1–3 рабочих дней.
              Частые вопросы собраны в разделе «Частые вопросы».
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
              <Link href="/faq" className="content-link-outline">
                Частые вопросы
              </Link>
            </div>
          </section>
          </div>

          <BackButton />
        </div>
        <Footer />
      </main>
    </>
  );
}
