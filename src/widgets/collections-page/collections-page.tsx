"use client";
import { CollectionsContent, Footer, Header } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import { useMemo } from "react";

export default function CollectionsPage() {
  // SEO для страницы коллекций
  const seoConfig = useMemo(() => ({
    title: "Коллекции",
    description: "Просмотрите все доступные коллекции тайтлов",
    keywords: "коллекции, тайтлы, манга, коллекция",
    image: "/logo/tomilo_color.svg",
  }), []);

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

