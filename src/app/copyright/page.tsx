import { Mail, FileText, Clock, Shield, Languages } from "lucide-react";
import { Footer, Header } from "@/widgets";
import content from "@/constants/copyright";
import { BackButton, Breadcrumbs } from "@/shared";
import { Metadata } from "next";

interface CopyrightPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: CopyrightPageProps): Promise<Metadata> {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = content[language];

  return {
    title: currentContent.title,
    description: currentContent.description,
  };
}

export default async function CopyrightPage({ searchParams }: CopyrightPageProps) {
  const params = await searchParams;
  const language = (params.lang === "en" ? "en" : "ru") as "ru" | "en";
  const currentContent = content[language];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="content-page flex-1 pb-20 md:pb-0">
        <div className="content-page-inner">
          <Breadcrumbs className="mb-6" />
          <div className="flex justify-end mb-6">
            <a
              href={`?lang=${language === "ru" ? "en" : "ru"}`}
              className="btn-lang"
            >
              <Languages className="w-4 h-4" />
              {currentContent.languageButton}
            </a>
          </div>

          <div className="content-page-hero mb-10">
            <h1>{currentContent.title}</h1>
            <p>{currentContent.description}</p>
          </div>

          <div className="content-card mb-8">
            <div className="space-y-8">
              <p className="content-card-body">{currentContent.section1}</p>

              <div>
                <h2 className="content-card-section-title">
                  <FileText className="w-6 h-6" />
                  {currentContent.notificationTitle}
                </h2>
                <p className="content-card-body">{currentContent.notificationText}</p>
              </div>

              <div>
                <h3 className="content-card-section-title text-base">
                  {currentContent.requirementsTitle}
                </h3>
                <p className="content-card-body mb-4">{currentContent.requirementsText}</p>
                <ul className="content-card-body list-disc list-inside space-y-1">
                  {currentContent.requirementsList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-start gap-3 p-4 bg-[var(--accent)] rounded-lg">
                <Clock className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                <p className="content-card-body mb-0">
                  {currentContent.processingTime}
                </p>
              </div>

              <div className="border-l-4 border-[var(--primary)] pl-4 py-2 bg-[var(--accent)]/30 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                  <p className="content-card-body mb-0">{currentContent.warning}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="content-card mb-8 text-center">
            <h3 className="content-card-section-title justify-center">
              <Mail className="w-6 h-6" />
              {currentContent.contactTitle}
            </h3>
            <p className="content-card-body mb-2">{currentContent.contactDescription}</p>
            <div className="content-contact-email">
              <a href={`mailto:${currentContent.email}`}>{currentContent.email}</a>
            </div>
          </div>

          <BackButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}
