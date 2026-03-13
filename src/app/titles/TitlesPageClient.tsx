"use client";

import { Footer, Header } from "@/widgets";
import TitlesCatalogPage from "@/shared/browse/TitlesCatalogPage";

export function TitlesPageClient() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-2 sm:pt-4 max-lg:pb-[calc(var(--mobile-footer-bar-height)_+_0.5rem)] md:pb-16">
        <TitlesCatalogPage />
      </main>

      <Footer />
    </div>
  );
}
