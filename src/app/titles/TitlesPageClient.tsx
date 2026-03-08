"use client";

import { Footer, Header } from "@/widgets";
import TitlesContent from "@/shared/browse/TitlesContent";
import { PullToRefresh } from "@/shared/pull-to-refresh/PullToRefresh";

export function TitlesPageClient() {
  const handleRefresh = () =>
    new Promise<void>(resolve => {
      window.dispatchEvent(new CustomEvent("pull-to-refresh-titles", { detail: { resolve } }));
    });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-20 md:pb-16 pt-2 sm:pt-4">
        <PullToRefresh onRefresh={handleRefresh} mobileOnly>
          <TitlesContent />
        </PullToRefresh>
      </main>

      <Footer />
    </div>
  );
}
