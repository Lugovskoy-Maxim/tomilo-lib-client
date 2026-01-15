"use client";

import { Footer, Header } from "@/widgets";
import TitlesContent from "@/shared/browse/titles-content";

export default function TitlesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-20 md:pb-6">
        <TitlesContent />
      </div>

      <Footer />
    </main>
  );
}

