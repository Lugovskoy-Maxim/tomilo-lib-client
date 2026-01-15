"use client";

import { AuthGuard } from "@/guard/AuthGuard";
import { useProfile } from "@/hooks/useProfile";
import { ErrorState, LoadingState } from "@/shared";

import { Footer, Header, ReadingHistorySection } from "@/widgets";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

export default function HistoryPage() {
  const { userProfile, isLoading, authLoading } = useProfile();

  // SEO для страницы истории чтения
  useSEO(seoConfigs.history);

  if (authLoading || isLoading) {
    return <LoadingState />;
  }

  if (!userProfile) {
    return <ErrorState />;
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">История чтения</h1>
            <p className="text-[var(--muted-foreground)] mt-2">Все прочитанные вами главы</p>
          </div>

          <ReadingHistorySection readingHistory={userProfile.readingHistory} />
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}

