import {
  Shield,
  AlertTriangle,
  Users,
  Book,
  Mail,
  Languages,
} from "lucide-react";
import { Footer, Header } from "@/widgets";
import { BackButton } from "@/shared";
import termsOfUse from "@/constants/terms-of-use";
import { Metadata } from "next";

interface TermsOfUsePageProps {
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({
  searchParams,
}: TermsOfUsePageProps): Promise<Metadata> {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = termsOfUse[language];

  return {
    title: currentContent.title,
    description: currentContent.description,
  };
}

export default async function TermsOfServicePage({
  searchParams,
}: TermsOfUsePageProps) {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = termsOfUse[language];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Переключатель языка */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-[var(--muted-foreground)]">
              {currentContent.lastUpdated}
            </div>
            <a
              href={`?lang=${language === "ru" ? "en" : "ru"}`}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
            >
              <Languages className="w-4 h-4" />
              {currentContent.languageButton}
            </a>
          </div>

          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--muted-foreground)] mb-4">
              {language === "ru" ? "tomilo-lib.ru | " : ""}
              {currentContent.title}
            </h1>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              {currentContent.description}
            </p>
          </div>

          {/* Важные уведомления */}
          <div className="bg-[var(--chart-3)]/9 border border-[var(--chart-3)]  rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  {language === "ru"
                    ? "Важная информация"
                    : "Important Information"}
                </h3>
                <ul className="space-y-2">
                  {currentContent.importantNotes.map((note, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-yellow-700"
                    >
                      <Shield className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Навигация по разделам */}
          {/* <div className="flex flex-wrap gap-3 justify-center mb-8">
            {Object.keys(currentContent.sections).map((sectionKey) => (
              <button
                key={sectionKey}
                onClick={() => scrollToSection(sectionKey)}
                className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] rounded-lg hover:bg-[var(--accent)] transition-colors text-sm"
              >
                {currentContent.sections[sectionKey as keyof typeof currentContent.sections].title.split(' ')[0]}
              </button>
            ))}
          </div> */}

          {/* Основной контент */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 mb-8">
            <div className="prose prose-lg max-w-none text-[var(--muted-foreground)]">
              {/* Общие положения */}
              <div className="mb-8" id="general">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-[var(--primary)]" />
                  {currentContent.sections.general.title}
                </h2>
                <p className="leading-relaxed">
                  {currentContent.sections.general.content}
                </p>
              </div>

              {/* Термины и определения */}
              <div className="mb-8" id="definitions">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4">
                  {currentContent.sections.definitions.title}
                </h2>
                <ul className="list-disc list-inside space-y-2 text-[var(--muted-foreground)] leading-relaxed">
                  {currentContent.sections.definitions.items.map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Предмет соглашения */}
              <div className="mb-8" id="agreement">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4">
                  {currentContent.sections.agreement.title}
                </h2>
                <ul className="list-disc list-inside space-y-2 text-[var(--muted-foreground)] leading-relaxed">
                  {currentContent.sections.agreement.items.map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Права и обязанности пользователя */}
              <div className="mb-8" id="userRights">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4">
                  {currentContent.sections.userRights.title}
                </h2>
                <ul className="list-disc list-inside space-y-2 text-[var(--muted-foreground)] leading-relaxed">
                  {currentContent.sections.userRights.items.map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Права и обязанности администрации */}
              <div className="mb-8" id="adminRights">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4">
                  {currentContent.sections.adminRights.title}
                </h2>
                <ul className="list-disc list-inside space-y-2 text-[var(--muted-foreground)] leading-relaxed">
                  {currentContent.sections.adminRights.items.map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Интеллектуальная собственность */}
              <div className="mb-8" id="intellectualProperty">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4 flex items-center gap-2">
                  <Book className="w-6 h-6 text-[var(--primary)]" />
                  {currentContent.sections.intellectualProperty.title}
                </h2>
                <ul className="list-disc list-inside space-y-2 text-[var(--muted-foreground)] leading-relaxed">
                  {currentContent.sections.intellectualProperty.items.map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Ограничение ответственности */}
              <div className="mb-8" id="liability">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4">
                  {currentContent.sections.liability.title}
                </h2>
                <ul className="list-disc list-inside space-y-2 text-[var(--muted-foreground)] leading-relaxed">
                  {currentContent.sections.liability.items.map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Прочие условия */}
              <div className="mb-8" id="other">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4">
                  {currentContent.sections.other.title}
                </h2>
                <ul className="list-disc list-inside space-y-2 text-[var(--muted-foreground)] leading-relaxed">
                  {currentContent.sections.other.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 mb-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4 flex items-center justify-center gap-2">
                <Mail className="w-6 h-6 text-[var(--primary)]" />
                {currentContent.contact.title}
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                {currentContent.contact.description}
              </p>
              <div className="bg-[var(--accent)] rounded-lg p-4 inline-block">
                <a
                  href={`mailto:${currentContent.contact.email}`}
                  className="text-[var(--chart-1)] font-medium hover:underline"
                >
                  {currentContent.contact.email}
                </a>
              </div>
            </div>
          </div>

          {/* Подтверждение согласия */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 mb-8">
            <div className="text-center">
              <p className="text-[var(--muted-foreground)] mb-4">
                {language === "ru"
                  ? "Используя наш сервис, вы подтверждаете, что ознакомились и согласны с условиями данного Пользовательского соглашения"
                  : "By using our service, you confirm that you have read and agree to the terms of this Terms of Service Agreement"}
              </p>
            </div>
          </div>

          {/* Кнопка назад */}
          <BackButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}
