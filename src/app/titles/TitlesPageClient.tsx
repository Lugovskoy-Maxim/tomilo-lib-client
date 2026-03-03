"use client";

import { Footer, Header } from "@/widgets";
import TitlesContent from "@/shared/browse/TitlesContent";

export function TitlesPageClient() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-20 md:pb-16 pt-2 sm:pt-4">
        <TitlesContent />
      </main>

      <Footer />
    </div>
  );
}
