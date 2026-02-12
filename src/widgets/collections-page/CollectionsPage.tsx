"use client";
import { CollectionsContent, Footer, Header } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import { useMemo } from "react";

export default function CollectionsPage() {
  // SEO для страницы коллекций
  const seoConfig = useMemo(
    () => ({
      title: "Коллекции",
      description: "Просмотрите все доступные коллекции тайтлов",
      keywords: "коллекции, тайтлы, манга, коллекция",
      image: "/logo/tomilo_color.svg",
    }),
    [],
  );

  useSEO(seoConfig);

  return (
    <main className="flex flex-col min-h-screen bg-[var(--background)]">
      <Header />

      {/* Hero strip */}
      <section className="relative w-full border-b border-[var(--border)] bg-[var(--card)]/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--primary)/8%,transparent)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                Коллекции
              </h1>
              <p className="mt-2 text-[var(--muted-foreground)] text-base sm:text-lg max-w-xl">
                Подборки тайтлов по темам и жанрам — выбирайте и читайте с удобством.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <CollectionsContent />
      </div>

      <Footer />
    </main>
  );
}
