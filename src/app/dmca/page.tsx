import { Mail, FileText, Clock, Shield, Languages, AlertCircle } from "lucide-react";
import { Footer, Header } from "@/widgets";
import content from "@/constants/dmca";
import BackButton from "@/shared/back-button/BackButton";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { Metadata } from "next";

interface DmcaPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: DmcaPageProps): Promise<Metadata> {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = content[language];

  return {
    title: currentContent.title,
    description: currentContent.description,
  };
}

export default async function DmcaPage({ searchParams }: DmcaPageProps) {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = content[language];

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
            {currentContent.title}
          </h1>
          <p className="text-[1.0625rem] text-[var(--muted-foreground)] max-w-3xl mx-auto leading-relaxed">
            {currentContent.description}
          </p>
        </div>

        <div className="content-card bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 sm:p-8 sm:rounded-2xl mb-8">
          <div className="space-y-8">
            <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
              {currentContent.section1}
            </p>

            <div>
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <FileText className="w-6 h-6" />
                {currentContent.notificationTitle}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
                {currentContent.notificationText}
              </p>
            </div>

            <div>
              <h3 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0 text-base">
                {currentContent.requirementsTitle}
              </h3>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed mb-4">
                {currentContent.requirementsText}
              </p>
              <ol className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-decimal list-inside space-y-1">
                {currentContent.requirementsList.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0 text-base">
                <AlertCircle className="w-5 h-5" />
                {currentContent.counterNoticeTitle}
              </h3>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed mb-4">
                {currentContent.counterNoticeText}
              </p>
              <ol className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-decimal list-inside space-y-1">
                {currentContent.counterNoticeList.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[var(--accent)] rounded-lg">
              <Clock className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed mb-0">
                {currentContent.processingTime}
              </p>
            </div>

            <div className="border-l-4 border-[var(--primary)] pl-4 py-2 bg-[var(--accent)]/30 rounded-r-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed mb-0">
                  {currentContent.warning}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 sm:p-8 sm:rounded-2xl mb-8 text-center">
          <h3 className="content-card-section-title flex items-center justify-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
            <Mail className="w-6 h-6" />
            {currentContent.contactTitle}
          </h3>
          <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed mb-2">
            {currentContent.contactDescription}
          </p>
          <div className="content-contact-email inline-block py-3 px-5 rounded-lg mt-2 bg-[var(--accent)]">
            <a href={`mailto:${currentContent.email}`}>{currentContent.email}</a>
          </div>
        </div>

        <BackButton text={currentContent.backButton} />
      </div>
      <Footer />
    </main>
  );
}
