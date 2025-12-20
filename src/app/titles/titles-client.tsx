"use client";
import { BrowseContent, Footer, Header } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import { useMemo } from "react";

interface TitlesPageClientProps {
  searchQuery?: string;
}

export default function TitlesPageClient() {
  // SEO для страницы каталога тайтлов
  const seoConfig = useMemo(() => ({
    title: "Каталог тайтлов - Tomilo-lib.ru",
    description: "Просматривайте полный каталог манги, манхвы и маньхуа. Ищите по жанрам, годам выпуска, статусу и типу.",
    keywords: "каталог манги, манхва, маньхуа, поиск по жанрам, онлайн чтение",
  }), []);
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
