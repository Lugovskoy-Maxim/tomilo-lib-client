"use client";

import { AuthGuard } from "@/guard/AuthGuard";
import { useProfile } from "@/hooks/useProfile";
import { ErrorState, LoadingState } from "@/shared";

import { Footer, Header, BookmarksSection } from "@/widgets";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

export default function BookmarksPage() {
  const { userProfile, isLoading, authLoading } = useProfile();

  // SEO для страницы закладок
  useSEO(seoConfigs.bookmarks);

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

        <div className="max-w-7xl mx-auto px-4 py-4 pb-20 md:pb-0">
          <div className="mb-6 pt-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Мои закладки</h1>
            <p className="text-[var(--muted-foreground)] mt-2">Все сохраненные вами манги</p>
          </div>

          <BookmarksSection bookmarks={userProfile.bookmarks} readingHistory={userProfile.readingHistory} showAll={true} />
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
