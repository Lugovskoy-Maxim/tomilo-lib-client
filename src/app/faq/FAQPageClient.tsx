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
  Mail,
  Send,
} from "lucide-react";
import { Header, Footer } from "@/widgets";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import BackButton from "@/shared/back-button/BackButton";
import { FAQ_DATA, type FAQSectionData } from "@/constants/faq";

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Чтение: BookOpen,
  "Профиль и аккаунт": User,
  Уведомления: Bell,
  Приватность: Shield,
  "Контент и отображение": Eye,
  "Монеты и достижения": Coins,
  "Общие вопросы": Settings,
};

const LAST_UPDATED = "Последнее обновление: 06.03.2025";

interface FAQSection extends FAQSectionData {
  icon: React.ComponentType<{ className?: string }>;
}

const faqSections: FAQSection[] = FAQ_DATA.map(data => ({
  ...data,
  icon: SECTION_ICONS[data.section] ?? Settings,
}));

function FAQAccordion({ section }: { section: FAQSection }) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]));
  };

  const Icon = section.icon;

  return (
    <div className="content-card bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 sm:p-8 sm:rounded-2xl">
      <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
        <Icon className="w-5 h-5" />
        {section.section}
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
        <div className="content-card bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 sm:p-8 sm:rounded-2xl mb-6">
          <div className="text-sm text-[var(--muted-foreground)]">{LAST_UPDATED}</div>
        </div>
        <div className="content-page-hero text-center mb-10">
          <h1 className="flex items-center justify-center gap-3">
            <HelpCircle className="w-8 h-8" />
            Частые вопросы
          </h1>
          <p>
            Ответы на популярные вопросы о работе платформы, настройках профиля, чтении и других
            функциях сервиса.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {faqSections.map(section => (
            <FAQAccordion key={section.section} section={section} />
          ))}

          <section className="content-card bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 sm:p-8 sm:rounded-2xl lg:col-span-2">
            <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
              <Mail className="w-5 h-5" />
              Не нашли ответ?
            </h2>
            <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
              Если вы не нашли ответ на свой вопрос, свяжитесь с нами любым удобным способом. Мы
              постараемся ответить как можно скорее.
            </p>
            <div className="content-link-group flex flex-wrap gap-3 mt-4">
              <Link
                href="mailto:support@tomilo-lib.ru"
                className="content-link-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium no-underline bg-[var(--accent)] text-[var(--chart-1)]"
              >
                <Mail className="w-4 h-4" />
                support@tomilo-lib.ru
              </Link>
              <Link
                href="https://t.me/tomilolib"
                target="_blank"
                rel="noopener noreferrer"
                className="content-link-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium no-underline bg-[var(--accent)] text-[var(--chart-1)]"
              >
                <Send className="w-4 h-4" />
                Telegram-канал
              </Link>
              <Link
                href="/contact"
                className="content-link-outline inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-[var(--border)] text-[var(--foreground)] no-underline"
              >
                Страница контактов
              </Link>
            </div>
          </section>
        </div>

        <BackButton />
      </div>
      <Footer />
    </main>
  );
}
