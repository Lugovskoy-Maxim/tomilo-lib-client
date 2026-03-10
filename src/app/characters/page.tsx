import type { Metadata } from "next";
import { buildServerSEOMetadata } from "@/lib/seo-metadata";
import { getDefaultOgImageUrl } from "@/lib/seo-og-image";
import CharactersListClient from "./CharactersListClient";

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export async function generateMetadata(): Promise<Metadata> {
  return buildServerSEOMetadata({
    title: "Персонажи — каталог персонажей манги и манхвы | Tomilo-lib.ru",
    description:
      "Каталог персонажей манги, манхвы и маньхуа на Tomilo-lib. Главные и второстепенные герои, описание, роли и связь с тайтлами. Читать онлайн.",
    keywords:
      "персонажи манги, герои манхвы, каталог персонажей, главные персонажи, описание персонажей, манга онлайн",
    canonicalUrl: `${baseUrl}/characters`,
    ogImageUrl: getDefaultOgImageUrl(baseUrl),
    ogImageAlt: "Tomilo-lib — персонажи",
    type: "website",
  });
}

export default function CharactersPage() {
  return <CharactersListClient />;
}
