import { Metadata } from "next";
import { HomePage } from "@/widgets";

// Функция для генерации SEO метаданных
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

  return {
    title: "Tomilo-lib.ru - Читать мангу, манхву и маньхуа онлайн",
    description: "Большая коллекция манги, манхвы и маньхуа  для чтения онлайн бесплатно. Удобный интерфейс, регулярные обновления, закладки и история чтения.",
    keywords: "манга, маньхуа, чтение онлайн, тайтлы, главы, манхва, бесплатно, онлайн, читать",
    openGraph: {
      title: "Tomilo-lib.ru - Читать мангу, манхву и маньхуа онлайн",
      description: "Большая коллекция манги, манхвы и маньхуа  для чтения онлайн бесплатно. Удобный интерфейс, регулярные обновления, закладки и история чтения.",
      type: "website",
      url: baseUrl,
      siteName: "Tomilo-lib.ru",
    },
    twitter: {
      card: "summary_large_image",
      title: "Tomilo-lib.ru - Читать мангу, манхву и маньхуа онлайн",
      description: "Большая коллекция манги, манхвы и маньхуа  для чтения онлайн бесплатно. Удобный интерфейс, регулярные обновления, закладки и история чтения.",
    },
  };
}

export default function Home() {
  return <HomePage />;
}
