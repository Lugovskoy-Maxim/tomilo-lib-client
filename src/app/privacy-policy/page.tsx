import { Shield, Database, Target, Cookie, Share2, Clock, Lock, UserCheck, Users, FileEdit, Mail, Languages } from "lucide-react";
import { Footer, Header } from "@/widgets";
import { BackButton, Breadcrumbs } from "@/shared";
import privacyPolicy from "@/constants/privacy-policy";
import { Metadata } from "next";

interface PrivacyPolicyPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: PrivacyPolicyPageProps): Promise<Metadata> {
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
        <div className="content-card mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-sm text-[var(--muted-foreground)]">{currentContent.lastUpdated}</div>
            <a href={`?lang=${language === "ru" ? "en" : "ru"}`} className="btn-lang">
              <Languages className="w-4 h-4" />
              {currentContent.languageButton}
            </a>
          </div>
        </div>

        <div className="content-page-hero mb-10">
          <h1>
            {language === "ru" ? "tomilo-lib.ru | " : ""}
            {currentContent.title}
          </h1>
          <p>{currentContent.description}</p>
        </div>

        <div className="info-alert mb-8">
          <h3>{language === "ru" ? "Важная информация" : "Important Information"}</h3>
          <ul className="space-y-2">
            {currentContent.importantNotes.map((note, index) => (
              <li key={index}>
                <Shield className="w-4 h-4" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="content-card mb-8">
          <div className="space-y-8">
            <div id="general">
              <h2 className="content-card-section-title">
                <Shield className="w-6 h-6" />
                {currentContent.sections.general.title}
              </h2>
              <p className="content-card-body">{currentContent.sections.general.content}</p>
            </div>

            <div id="dataCollected">
              <h2 className="content-card-section-title">
                <Database className="w-6 h-6" />
                {currentContent.sections.dataCollected.title}
              </h2>
              <ul className="content-card-body list-disc list-inside space-y-1">
                {currentContent.sections.dataCollected.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="purposes">
              <h2 className="content-card-section-title">
                <Target className="w-6 h-6" />
                {currentContent.sections.purposes.title}
              </h2>
              <ul className="content-card-body list-disc list-inside space-y-1">
                {currentContent.sections.purposes.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="cookies">
              <h2 className="content-card-section-title">
                <Cookie className="w-6 h-6" />
                {currentContent.sections.cookies.title}
              </h2>
              <p className="content-card-body">{currentContent.sections.cookies.content}</p>
            </div>

            <div id="thirdParties">
              <h2 className="content-card-section-title">
                <Share2 className="w-6 h-6" />
                {currentContent.sections.thirdParties.title}
              </h2>
              <ul className="content-card-body list-disc list-inside space-y-1">
                {currentContent.sections.thirdParties.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="retention">
              <h2 className="content-card-section-title">
                <Clock className="w-6 h-6" />
                {currentContent.sections.retention.title}
              </h2>
              <p className="content-card-body">{currentContent.sections.retention.content}</p>
            </div>

            <div id="security">
              <h2 className="content-card-section-title">
                <Lock className="w-6 h-6" />
                {currentContent.sections.security.title}
              </h2>
              <p className="content-card-body">{currentContent.sections.security.content}</p>
            </div>

            <div id="userRights">
              <h2 className="content-card-section-title">
                <UserCheck className="w-6 h-6" />
                {currentContent.sections.userRights.title}
              </h2>
              <ul className="content-card-body list-disc list-inside space-y-1">
                {currentContent.sections.userRights.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div id="children">
              <h2 className="content-card-section-title">
                <Users className="w-6 h-6" />
                {currentContent.sections.children.title}
              </h2>
              <p className="content-card-body">{currentContent.sections.children.content}</p>
            </div>

            <div id="changes">
              <h2 className="content-card-section-title">
                <FileEdit className="w-6 h-6" />
                {currentContent.sections.changes.title}
              </h2>
              <p className="content-card-body">{currentContent.sections.changes.content}</p>
            </div>
          </div>
        </div>

        <div className="content-card mb-8 text-center">
          <h3 className="content-card-section-title justify-center">
            <Mail className="w-6 h-6" />
            {currentContent.contact.title}
          </h3>
          <p className="content-card-body mb-2">{currentContent.contact.description}</p>
          <div className="content-contact-email">
            <a href={`mailto:${currentContent.contact.email}`}>{currentContent.contact.email}</a>
          </div>
        </div>

        <div className="content-card mb-8">
          <p className="content-card-body text-center">{currentContent.consentNote}</p>
        </div>

        <BackButton />
      </div>
      <Footer />
    </main>
  );
}
