"use client";
import { Mail, FileText, Clock, Shield, Languages } from "lucide-react";
import { Footer, Header } from "@/widgets";
import { useState } from "react";
import content from "@/constants/copyright";
import { BackButton } from "@/shared";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

export default function CopyrightPage() {
  const [language, setLanguage] = useState<"ru" | "en">("ru");

  const currentContent = content[language];

  // SEO для страницы авторских прав
  useSEO(seoConfigs.static(
    currentContent.title,
    currentContent.description
  ));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Переключатель языка */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
            >
              <Languages className="w-4 h-4" />
              {currentContent.languageButton}
            </button>
          </div>

          {/* Заголовок */}
          <div className="text-center mb-12">
            <div className="relative mb-8">
              {/* <div className="w-32 h-32 mx-auto flex items-center justify-center">
                <Scale className="w-20 h-20 text-[var(--primary)]" />
              </div> */}
            </div>
            <h1 className="text-4xl font-bold text-[var(--muted-foreground)] mb-4">
              {currentContent.title}
            </h1>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              {currentContent.description}
            </p>
          </div>

          {/* Основной контент */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 mb-8">
            <div className="prose prose-lg max-w-none text-[var(--muted-foreground)]">
              {/* Первый раздел */}
              <div className="mb-8">
                <p className="mb-4 leading-relaxed">
                  {currentContent.section1}
                </p>
              </div>

              {/* Уведомление о нарушении */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[var(--primary)]" />
                  {currentContent.notificationTitle}
                </h2>
                <p className="mb-4 leading-relaxed">
                  {currentContent.notificationText}
                </p>
              </div>

              {/* Требования DMCA */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[var(--muted-foreground)] mb-4">
                  {currentContent.requirementsTitle}
                </h3>
                <p className="mb-4 leading-relaxed">
                  {currentContent.requirementsText}
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-[var(--muted-foreground)] leading-relaxed">
                  {currentContent.requirementsList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Время обработки */}
              <div className="mb-8">
                <div className="flex items-start gap-3 p-4 bg-[var(--accent)] rounded-lg">
                  <Clock className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                  <p className="text-[var(--muted-foreground)] leading-relaxed">
                    {currentContent.processingTime}
                  </p>
                </div>
              </div>

              {/* Предупреждение */}
              <div className="border-l-4 border-[var(--primary)] pl-4 py-2 bg-[var(--accent)]/30 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                  <p className="text-[var(--muted-foreground)] leading-relaxed">
                    {currentContent.warning}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 mb-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-[var(--muted-foreground)] mb-4 flex items-center justify-center gap-2">
                <Mail className="w-6 h-6 text-[var(--primary)]" />
                {currentContent.contactTitle}
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                {currentContent.contactDescription}
              </p>
              <div className="bg-[var(--accent)] rounded-lg p-4 inline-block">
                <a
                  href={`mailto:${currentContent.email}`}
                  className="text-[var(--chart-1)] font-medium hover:underline"
                >
                  {currentContent.email}
                </a>
              </div>
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
