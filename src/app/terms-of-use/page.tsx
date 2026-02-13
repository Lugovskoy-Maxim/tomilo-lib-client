import { Shield, Users, Book, Mail, Languages } from "lucide-react";
import { Footer, Header } from "@/widgets";
import { BackButton, Breadcrumbs } from "@/shared";
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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="content-page flex-1 pb-20 md:pb-0">
        <div className="content-page-inner">
          <Breadcrumbs className="mb-6" />
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="text-sm text-[var(--muted-foreground)]">
              {currentContent.lastUpdated}
            </div>
            <a
              href={`?lang=${language === "ru" ? "en" : "ru"}`}
              className="btn-lang"
            >
              <Languages className="w-4 h-4" />
              {currentContent.languageButton}
            </a>
          </div>

          <div className="content-page-hero mb-10">
            <h1>
              {language === "ru" ? "tomilo-lib.ru | " : ""}
              {currentContent.title}
            </h1>
            <p>{currentContent.description}</p>
          </div>

          <div className="info-alert mb-8">
            <h3>
              {language === "ru" ? "Важная информация" : "Important Information"}
            </h3>
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
                  <Users className="w-6 h-6" />
                  {currentContent.sections.general.title}
                </h2>
                <p className="content-card-body">{currentContent.sections.general.content}</p>
              </div>

              <div id="definitions">
                <h2 className="content-card-section-title">
                  {currentContent.sections.definitions.title}
                </h2>
                <ul className="content-card-body list-disc list-inside space-y-1">
                  {currentContent.sections.definitions.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div id="agreement">
                <h2 className="content-card-section-title">
                  {currentContent.sections.agreement.title}
                </h2>
                <ul className="content-card-body list-disc list-inside space-y-1">
                  {currentContent.sections.agreement.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div id="userRights">
                <h2 className="content-card-section-title">
                  {currentContent.sections.userRights.title}
                </h2>
                <ul className="content-card-body list-disc list-inside space-y-1">
                  {currentContent.sections.userRights.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div id="adminRights">
                <h2 className="content-card-section-title">
                  {currentContent.sections.adminRights.title}
                </h2>
                <ul className="content-card-body list-disc list-inside space-y-1">
                  {currentContent.sections.adminRights.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div id="intellectualProperty">
                <h2 className="content-card-section-title">
                  <Book className="w-6 h-6" />
                  {currentContent.sections.intellectualProperty.title}
                </h2>
                <ul className="content-card-body list-disc list-inside space-y-1">
                  {currentContent.sections.intellectualProperty.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div id="liability">
                <h2 className="content-card-section-title">
                  {currentContent.sections.liability.title}
                </h2>
                <ul className="content-card-body list-disc list-inside space-y-1">
                  {currentContent.sections.liability.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div id="other">
                <h2 className="content-card-section-title">
                  {currentContent.sections.other.title}
                </h2>
                <ul className="content-card-body list-disc list-inside space-y-1">
                  {currentContent.sections.other.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
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
              <a href={`mailto:${currentContent.contact.email}`}>
                {currentContent.contact.email}
              </a>
            </div>
          </div>

          <div className="content-card mb-8">
            <p className="content-card-body text-center">
              {language === "ru"
                ? "Используя наш сервис, вы подтверждаете, что ознакомились и согласны с условиями данного Пользовательского соглашения"
                : "By using our service, you confirm that you have read and agree to the terms of this Terms of Service Agreement"}
            </p>
          </div>

          <BackButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}
