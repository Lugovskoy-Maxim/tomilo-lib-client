import { Metadata } from "next";
import Link from "next/link";
import { Mail, Send, Clock, Code, FileText } from "lucide-react";
import { Header, Footer } from "@/widgets";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import BackButton from "@/shared/back-button/BackButton";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
const LAST_UPDATED = "Последнее обновление: 06.03.2025";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "Контакты — связь с командой Tomilo-lib | Tomilo-lib.ru",
    description:
      "Контактная информация Tomilo-lib. Email поддержки, Telegram-канал, связь с разработчиками. Мы готовы помочь!",
    keywords:
      "контакты, связаться, поддержка, email, Telegram, обратная связь, Tomilo-lib, помощь",
    canonicalUrl: `${baseUrl}/contact`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — контакты",
    type: "website",
  });
}

const contactBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Контакты", item: `${baseUrl}/contact` },
  ],
};

const contactPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  mainEntity: {
    "@type": "Organization",
    name: "Tomilo-lib.ru",
    url: baseUrl,
    email: "support@tomilo-lib.ru",
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "support@tomilo-lib.ru",
        contactType: "customer support",
        availableLanguage: "Russian",
      },
    ],
    sameAs: ["https://t.me/tomilolib", "https://t.me/TomiloDev"],
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactBreadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd) }}
      />
      <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
        <Header />
        <div className="w-full mx-auto px-2 min-[360px]:px-3 py-3 sm:px-4 sm:py-6 max-w-6xl min-w-0 overflow-x-hidden pb-12 sm:pb-16">
        <Breadcrumbs className="mb-6" />
        <div className="content-card mb-6">
          <div className="text-sm text-[var(--muted-foreground)]">{LAST_UPDATED}</div>
        </div>
        <div className="content-page-hero mb-10">
          <h1>Контакты</h1>
          <p>
            Технические проблемы, предложения по улучшению или вопросы по сервису — напишите нам
            по почте или в Telegram. По возможности укажите ссылку на страницу и опишите шаги,
            чтобы мы могли быстрее помочь.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="content-card">
            <h2 className="content-card-section-title">Каналы связи</h2>
            <div className="space-y-4">
              <Link href="mailto:support@tomilo-lib.ru" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center group-hover:opacity-90 transition-opacity">
                  <Mail className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">Email поддержки</p>
                  <p className="text-[var(--chart-1)] text-sm group-hover:underline">
                    support@tomilo-lib.ru
                  </p>
                </div>
              </Link>

              <Link
                href="https://t.me/tomilolib"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center group-hover:opacity-90 transition-opacity">
                  <Send className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">Telegram</p>
                  <p className="text-[var(--chart-1)] text-sm group-hover:underline">
                    Официальный канал
                  </p>
                </div>
              </Link>

              <Link
                href="https://t.me/TomiloDev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center group-hover:opacity-90 transition-opacity">
                  <Code className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">Разработка</p>
                  <p className="text-[var(--chart-1)] text-sm group-hover:underline">
                    @TomiloDev
                  </p>
                </div>
              </Link>
            </div>
          </section>

          <section className="content-card">
            <h2 className="content-card-section-title">
              <Clock className="w-5 h-5" />
              Как быстрее получить ответ
            </h2>
            <ul className="content-card-body space-y-1">
              <li>Укажите ссылку на страницу, где возникла проблема</li>
              <li>Опишите шаги, после которых появляется ошибка</li>
              <li>По возможности приложите скриншот (особенно для ошибок)</li>
              <li>Для вопросов по тайтлу или главе — название и ссылку</li>
              <li>Мы отвечаем в течение 1–3 рабочих дней</li>
            </ul>
          </section>

          <section className="content-card lg:col-span-2">
            <h3 className="content-card-section-title text-base">По каким вопросам можно писать</h3>
            <ul className="content-card-body text-sm space-y-1">
              <li>Технические проблемы, ошибки и сбои в работе сайта</li>
              <li>Предложения по новым функциям и улучшению интерфейса</li>
              <li>Вопросы по аккаунту, настройкам и правилам платформы</li>
              <li>Жалобы на контент или поведение пользователей</li>
              <li>Сотрудничество и реклама — только на указанные контакты</li>
            </ul>
          </section>

          <section className="content-card lg:col-span-2 border-l-4 border-[var(--primary)] pl-4 py-3 bg-[var(--accent)]/20 rounded-r-lg">
            <h3 className="content-card-section-title text-base">
              <FileText className="w-5 h-5" />
              Вопросы по авторским правам
            </h3>
            <p className="content-card-body text-sm mb-0">
              Уведомления о нарушении авторских прав и возражения (counter-notification) принимаются
              по процедуре DMCA. Подробные требования и контакт агента указаны на странице{" "}
              <Link href="/dmca" className="text-[var(--chart-1)] hover:underline font-medium">
                Авторские права (DMCA)
              </Link>
              .
            </p>
          </section>
        </div>

        <BackButton />
        </div>
        <Footer />
      </main>
    </>
  );
}
