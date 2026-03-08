import { Shield, Users, Book, Mail, Languages } from "lucide-react";
import { Footer, Header } from "@/widgets";
import BackButton from "@/shared/back-button/BackButton";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import termsOfUse from "@/constants/terms-of-use";
import { Metadata } from "next";

interface TermsOfUsePageProps {
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: TermsOfUsePageProps): Promise<Metadata> {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = termsOfUse[language];

  return {
    title: currentContent.title,
    description: currentContent.description,
  };
}

export default async function TermsOfServicePage({ searchParams }: TermsOfUsePageProps) {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = termsOfUse[language];

  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
      <Header />
      <div className="w-full mx-auto px-2 min-[360px]:px-3 py-3 sm:px-4 sm:py-6 max-w-6xl min-w-0 overflow-x-hidden pb-12 sm:pb-16">
        <Breadcrumbs className="mb-6" />
        <div className="content-card bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 sm:p-8 sm:rounded-2xl mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-sm text-[var(--muted-foreground)]">
              {currentContent.lastUpdated}
            </div>
            <a
              href={`?lang=${language === "ru" ? "en" : "ru"}`}
              className="btn-lang inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] no-underline"
            >
              <Languages className="w-4 h-4" />
              {currentContent.languageButton}
            </a>
          </div>
        </div>

        <div className="content-page-hero text-center mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-[var(--foreground)] mb-3 tracking-tight leading-tight">
            {language === "ru" ? "tomilo-lib.ru | " : ""}
            {currentContent.title}
          </h1>
          <p className="text-[1.0625rem] text-[var(--muted-foreground)] max-w-3xl mx-auto leading-relaxed">
            {currentContent.description}
          </p>
        </div>

        <div className="info-alert rounded-2xl p-5 px-6 mb-8">
          <h3 className="text-[1.0625rem] font-semibold mb-3 text-[var(--foreground)]">
            {language === "ru" ? "Важная информация" : "Important Information"}
          </h3>
          <ul className="list-none p-0 space-y-2">
            {currentContent.importantNotes.map((note, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-[0.9375rem] leading-normal [&_svg]:mt-0.5 [&_svg]:shrink-0"
              >
                <Shield className="w-4 h-4" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="content-card bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 sm:p-8 sm:rounded-2xl mb-8">
          <div className="space-y-8">
            <div id="general">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Users className="w-6 h-6" />
                {currentContent.sections.general.title}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
                {currentContent.sections.general.content}
              </p>
            </div>

            <div id="definitions">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                {currentContent.sections.definitions.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.definitions.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="agreement">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                {currentContent.sections.agreement.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.agreement.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="userContentRequirements">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                {currentContent.sections.userContentRequirements.title}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed mb-4">
                {currentContent.sections.userContentRequirements.intro}
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="content-card-body text-[var(--muted-foreground)] leading-relaxed font-semibold mb-2">
                    {currentContent.sections.userContentRequirements.nickname.title}
                  </h3>
                  <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                    {currentContent.sections.userContentRequirements.nickname.items.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="content-card-body text-[var(--muted-foreground)] leading-relaxed font-semibold mb-2">
                    {currentContent.sections.userContentRequirements.avatar.title}
                  </h3>
                  <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                    {currentContent.sections.userContentRequirements.avatar.items.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="content-card-body text-[var(--muted-foreground)] leading-relaxed font-semibold mb-2">
                    {currentContent.sections.userContentRequirements.comments.title}
                  </h3>
                  <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                    {currentContent.sections.userContentRequirements.comments.items.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div id="userRights">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                {currentContent.sections.userRights.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.userRights.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="adminRights">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                {currentContent.sections.adminRights.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.adminRights.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="intellectualProperty">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Book className="w-6 h-6" />
                {currentContent.sections.intellectualProperty.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.intellectualProperty.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="liability">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                {currentContent.sections.liability.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.liability.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="other">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                {currentContent.sections.other.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.other.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="content-card mb-8 text-center">
          <h3 className="content-card-section-title flex items-center justify-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
            <Mail className="w-6 h-6" />
            {currentContent.contact.title}
          </h3>
          <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed mb-2">
            {currentContent.contact.description}
          </p>
          <div className="content-contact-email inline-block py-3 px-5 rounded-lg mt-2 bg-[var(--accent)]">
            <a href={`mailto:${currentContent.contact.email}`}>{currentContent.contact.email}</a>
          </div>
        </div>

        <div className="content-card bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 sm:p-8 sm:rounded-2xl mb-8">
          <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed text-center">
            {language === "ru"
              ? "Используя наш сервис, вы подтверждаете, что ознакомились и согласны с условиями данного Пользовательского соглашения"
              : "By using our service, you confirm that you have read and agree to the terms of this Terms of Service Agreement"}
          </p>
        </div>

        <BackButton />
      </div>
      <Footer />
    </main>
  );
}
