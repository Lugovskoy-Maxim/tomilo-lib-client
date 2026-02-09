"use client";

import { Footer, Header } from "@/widgets";
import TitlesContent from "@/shared/browse/TitlesContent";

export function TitlesPageClient() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--secondary)] relative overflow-hidden">
      {/* Декоративные фоновые элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--primary)]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-[var(--chart-1)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[var(--primary)]/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header />

        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-5 pt-[var(--header-height)] pb-20 md:pb-12">
          <TitlesContent />
        </div>

        <Footer />
      </div>
    </main>
  );
}
