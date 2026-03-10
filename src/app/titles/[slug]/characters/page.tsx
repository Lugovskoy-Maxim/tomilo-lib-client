import type { Metadata } from "next";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getOgImageUrl, getDefaultOgImageUrl } from "@/lib/seo-og-image";
import { getTitleDisplayNameForSEO } from "@/lib/seo-title-name";
import { sanitizeMetaString } from "@/lib/seo-meta-sanitize";
import TitleCharactersPageClient from "./TitleCharactersPageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getTitleDataBySlug(slug: string) {
  try {
    const encodedSlug = encodeURIComponent(slug);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const response = await fetch(
      `${apiUrl}/titles/slug/${encodedSlug}?populateChapters=false`,
      {
        next: { revalidate: 60 },
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SEO-Bot/1.0)" },
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.data ?? data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(String(slug ?? ""));
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
  const titleData = await getTitleDataBySlug(decodedSlug);

  if (!titleData) {
    return {
      title: "Персонажи тайтла не найдены | Tomilo-lib.ru",
      description: "Запрашиваемый тайтл не найден на Tomilo-lib.ru",
      robots: { index: false, follow: false },
    };
  }

  const titleName = getTitleDisplayNameForSEO(titleData as Record<string, unknown>, decodedSlug);
  const safeTitle = sanitizeMetaString(`Персонажи — ${titleName} | Tomilo-lib.ru`);
  const description = `Каталог персонажей тайтла «${titleName}» на Tomilo-lib: главные и второстепенные герои, описание, роли. Читать мангу и манхву онлайн.`;
  const imageBaseUrl =
    process.env.NEXT_PUBLIC_IMAGE_URL ||
    (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "") ||
    baseUrl;
  const coverImage =
    titleData.coverImage ?? (titleData as { image?: string }).image ?? (titleData as { cover?: string }).cover;
  const ogImageUrl = getOgImageUrl(baseUrl, coverImage, imageBaseUrl) || getDefaultOgImageUrl(baseUrl);

  return buildServerSEOMetadata({
    title: safeTitle,
    description: sanitizeMetaString(description.substring(0, 160)),
    canonicalUrl: `${baseUrl}/titles/${decodedSlug}/characters`,
    ogImageUrl,
    ogImageAlt: `Персонажи — ${titleName}`,
    type: "website",
  });
}

export default function TitleCharactersPage() {
  return <TitleCharactersPageClient />;
}
