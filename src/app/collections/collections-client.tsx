"use client";
import { CollectionsContent, Footer, Header } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import { useMemo } from "react";

interface CollectionsPageClientProps {
  searchQuery?: string;
}

export default function CollectionsPageClient({ searchQuery }: CollectionsPageClientProps) {
  // SEO для страницы коллекций
  const seoConfig = useMemo(() => ({
    title: searchQuery ? `Поиск коллекций: ${searchQuery}` : "Коллекции",
    description: searchQuery
      ? `Найдите коллекции по запросу: ${searchQuery}`
      : "Просмотрите все доступные коллекции тайтлов",
    keywords: "коллекции, тайтлы, манга, коллекция",
    image: "/logo/tomilo_color.svg",
  }), [searchQuery]);
  useSEO(seoConfig);

  return (
    <main className="flex flex-col h-full min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-2 py-4">
        <CollectionsContent />
      </div>

      <Footer />
    </main>
  );
}
