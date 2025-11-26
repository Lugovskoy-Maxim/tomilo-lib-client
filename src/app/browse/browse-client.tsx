"use client";
import { BrowseContent, Footer, Header } from "@/widgets";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { useMemo } from "react";

interface BrowsePageClientProps {
  searchQuery?: string;
}

export default function BrowsePageClient({ searchQuery }: BrowsePageClientProps) {
  // SEO для страницы каталога
  const seoConfig = useMemo(() => seoConfigs.browse(searchQuery), [searchQuery]);
  useSEO(seoConfig);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-20 md:pb-6">
        <BrowseContent />
      </div>

      <Footer />
    </main>
  );
}
