import { Metadata } from "next";
import { HomePage } from "@/widgets";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";

// Функция для генерации SEO метаданных
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
  const title = "Tomilo-lib.ru — Манга, манхва и маньхуа читать онлайн бесплатно";
  const description =
    "Читайте мангу, манхву и маньхуа онлайн бесплатно. Тысячи тайтлов, удобный ридер, закладки и история чтения. Регулярные обновления, каталог по жанрам и коллекции.";
  const ogImageUrl = getDefaultOgImageUrl(baseUrl);

  return {
    title,
    description,
    keywords:
      "манга читать онлайн, манхва, маньхуа, комиксы онлайн, читать мангу бесплатно, тайтлы, главы манги, каталог манги, обновления манги, Tomilo-lib",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: baseUrl,
      languages: { "ru-RU": baseUrl },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: baseUrl,
      siteName: "Tomilo-lib.ru",
      locale: "ru_RU",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Tomilo-lib — манга, манхва, маньхуа онлайн",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: "@tomilo_lib",
      site: "@tomilo_lib",
    },
  };
}

export default function Home() {
  return <HomePage />;
}
