import { Suspense } from "react";
import TitlesClient from "./titles-client";
import { Metadata } from "next";

// Функция для генерации SEO метаданных
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

  return {
    title: "Каталог манги, манхвы, маньхуа и комиксов - Tomilo-lib.ru",
    description: "Полный каталог манги, манхвы, маньхуа и комиксов для чтения онлайн. Поиск по жанрам, годам выпуска, статусу и типу. Удобная навигация и регулярные обновления.",
    keywords: "каталог манги, манхва, маньхуа, комиксы, онлайн чтение, поиск тайтлов, жанры манги",
    openGraph: {
      title: "Каталог манги, манхвы, маньхуа и комиксов - Tomilo-lib.ru",
      description: "Полный каталог манги, манхвы, маньхуа и комиксов для чтения онлайн. Поиск по жанрам, годам выпуска, статусу и типу.",
      type: "website",
      url: `${baseUrl}/titles`,
      siteName: "Tomilo-lib.ru",
    },
    twitter: {
      card: "summary_large_image",
      title: "Каталог манги, манхвы, маньхуа и комиксов - Tomilo-lib.ru",
      description: "Полный каталог манги, манхвы, маньхуа и комиксов для чтения онлайн. Поиск по жанрам, годам выпуска, статусу и типу.",
    },
  };
}

export default function TitlesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <div className="text-[var(--foreground)]">Загрузка каталога...</div>
        </div>
      </div>
    }>
      <TitlesClient />
    </Suspense>
  );
}
