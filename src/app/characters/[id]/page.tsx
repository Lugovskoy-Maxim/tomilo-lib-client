import type { Metadata } from "next";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getOgImageUrl, getDefaultOgImageUrl } from "@/lib/seo-og-image";
import { sanitizeMetaString } from "@/lib/seo-meta-sanitize";
import CharacterPageClient from "./CharacterPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCharacterById(id: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const response = await fetch(`${apiUrl}/characters/${id}`, {
      next: { revalidate: 60 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEO-Bot/1.0)" },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
  const character = await getCharacterById(id);

  if (!character) {
    return {
      title: "Персонаж не найден | Tomilo-lib.ru",
      description: "Запрашиваемый персонаж не найден на Tomilo-lib.ru",
      robots: { index: false, follow: false },
    };
  }

  const name = character.name || "Персонаж";
  const descriptionText = character.description
    ? character.description.replace(/<[^>]*>/g, "").substring(0, 160)
    : `Персонаж ${name} на Tomilo-lib. Описание, роль, связь с тайтлами.`;
  const imageBaseUrl =
    process.env.NEXT_PUBLIC_IMAGE_URL ||
    (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "") ||
    baseUrl;
  const ogImageUrl = character.image
    ? getOgImageUrl(baseUrl, character.image, imageBaseUrl)
    : getDefaultOgImageUrl(baseUrl);

  return buildServerSEOMetadata({
    title: `${sanitizeMetaString(name)} — персонаж | Tomilo-lib.ru`,
    description: sanitizeMetaString(descriptionText),
    canonicalUrl: `${baseUrl}/characters/${id}`,
    ogImageUrl,
    ogImageAlt: `Персонаж: ${name}`,
    type: "website",
  });
}

export default async function CharacterPage() {
  return <CharacterPageClient />;
}
