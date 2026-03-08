import {
  Shield,
  Database,
  Target,
  Cookie,
  Share2,
  Clock,
  Lock,
  UserCheck,
  Users,
  FileEdit,
  Mail,
  Languages,
} from "lucide-react";
import { Footer, Header } from "@/widgets";
import BackButton from "@/shared/back-button/BackButton";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import privacyPolicy from "@/constants/privacy-policy";
import { Metadata } from "next";

interface PrivacyPolicyPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PrivacyPolicyPageProps): Promise<Metadata> {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = privacyPolicy[language];

  return {
    title: currentContent.title,
    description: currentContent.description,
  };
}

export default async function PrivacyPolicyPage({ searchParams }: PrivacyPolicyPageProps) {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = privacyPolicy[language];

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
                <Shield className="w-6 h-6" />
                {currentContent.sections.general.title}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
                {currentContent.sections.general.content}
              </p>
            </div>

            <div id="dataCollected">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Database className="w-6 h-6" />
                {currentContent.sections.dataCollected.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.dataCollected.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="purposes">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Target className="w-6 h-6" />
                {currentContent.sections.purposes.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.purposes.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="cookies">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Cookie className="w-6 h-6" />
                {currentContent.sections.cookies.title}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
                {currentContent.sections.cookies.content}
              </p>
            </div>

            <div id="thirdParties">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Share2 className="w-6 h-6" />
                {currentContent.sections.thirdParties.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.thirdParties.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="retention">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Clock className="w-6 h-6" />
                {currentContent.sections.retention.title}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
                {currentContent.sections.retention.content}
              </p>
            </div>

            <div id="security">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Lock className="w-6 h-6" />
                {currentContent.sections.security.title}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
                {currentContent.sections.security.content}
              </p>
            </div>

            <div id="userRights">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <UserCheck className="w-6 h-6" />
                {currentContent.sections.userRights.title}
              </h2>
              <ul className="content-card-body text-[var(--muted-foreground)] leading-relaxed list-disc list-inside space-y-1">
                {currentContent.sections.userRights.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="children">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <Users className="w-6 h-6" />
                {currentContent.sections.children.title}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
                {currentContent.sections.children.content}
              </p>
            </div>

            <div id="changes">
              <h2 className="content-card-section-title flex items-center gap-2 text-xl font-semibold text-[var(--foreground)] mb-4 [&_svg]:text-[var(--primary)] [&_svg]:shrink-0">
                <FileEdit className="w-6 h-6" />
                {currentContent.sections.changes.title}
              </h2>
              <p className="content-card-body text-[var(--muted-foreground)] leading-relaxed">
                {currentContent.sections.changes.content}
              </p>
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
            {currentContent.consentNote}
          </p>
        </div>

        <BackButton />
      </div>
      <Footer />
    </main>
  );
}
