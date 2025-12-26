"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import {
  useGetCollectionByIdQuery,
  useIncrementCollectionViewsMutation,
} from "@/store/api/collectionsApi";
import { LoadingSkeleton } from "@/shared";
import { Title } from "@/types/title";
import Image from "next/image";
import { Eye, Star } from "lucide-react";
import { getTitlePath } from "@/lib/title-paths";

import Script from "next/script";
import { translateTitleType } from "@/lib/title-type-translations";

interface CollectionDetailsClientProps {
  collectionId: string;
}

export default function CollectionDetailsClient({
  collectionId,
}: CollectionDetailsClientProps) {
  const router = useRouter();
  const {
    data: collectionResponse,
    isLoading,
    error,
  } = useGetCollectionByIdQuery(collectionId);
  const [incrementViews] = useIncrementCollectionViewsMutation();

  const collection = collectionResponse?.data;

  // Флаг для предотвращения множественных инкрементов просмотров
  const hasIncrementedViewsRef = useRef(false);

  // SEO для страницы коллекции
  const seoConfig = useMemo(
    () => ({
      title: collection?.name || "Коллекция",
      description: collection?.description || "Просмотрите коллекцию тайтлов",
      keywords: "коллекция, тайтлы, манга",
      image: collection?.cover || "/logo/tomilo_color.svg",
    }),
    [collection?.name, collection?.description, collection?.cover]
  );

  useSEO(seoConfig);

  const normalizeImageUrl = (cover: string) => {
    return cover
      ? process.env.NEXT_PUBLIC_URL + cover
      : "/404/image-holder.png";
  };

  // Увеличиваем просмотры при загрузке
  useEffect(() => {
    if (collectionId && !hasIncrementedViewsRef.current) {
      incrementViews(collectionId);
      hasIncrementedViewsRef.current = true;
    }
  }, [collectionId, incrementViews]);

  if (isLoading) {
    return (

      <main className="flex flex-col h-full min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 py-4">
          <LoadingSkeleton className="h-8 w-64 mb-4" />
          <LoadingSkeleton className="h-32 w-full mb-6" />
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !collection) {
    return (

      <main className="flex flex-col h-full min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 py-4 text-center">
          <h1 className="text-2xl font-bold text-[var(--muted-foreground)] mb-4">
            Коллекция не найдена
          </h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            Возможно, коллекция была удалена или ссылка неверна.
          </p>
          <button
            onClick={() => router.push("/collections")}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90"
          >
            Вернуться к коллекциям
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] mb-10">
      <Header />


      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 py-4">
        {/* Заголовок и информация о коллекции */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--muted-foreground)] mb-2 break-words">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-[var(--muted-foreground)] mb-4 leading-relaxed">
                {collection.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Eye className="w-4 h-4" />
                {collection.views} просмотров
              </span>
              <span className="whitespace-nowrap">{collection.titles?.length || 0} тайтлов</span>
              {collection.createdAt && (
                <span className="whitespace-nowrap">
                  Создано:{" "}
                  {new Date(collection.createdAt).toLocaleDateString("ru-RU")}
                </span>
              )}
            </div>
          </div>
          {collection.cover && (
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
              <Image
                loader={({ src, width }) => `${src}?w=${width}`}
                src={normalizeImageUrl(collection.cover)}
                alt={collection.name}
                width={192}
                height={192}
                className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>


        {/* Сетка тайтлов */}
        <div className="pb-6 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
          {collection.titles?.map((title: Title) => (
            <div
              key={title._id}
              onClick={() => router.push(getTitlePath({ id: title._id, slug: title.slug }))}
              className="bg-[var(--card)] max-h-[580px] overflow-hidden rounded-lg border border-[var(--border)] p-2 sm:p-3 lg:p-4 hover:border-[var(--primary)] transition-colors cursor-pointer group relative"
            >
              {/* Рейтинг */}
              {(
                <div className="absolute flex gap-1 top-2 left-2 z-10 bg-[var(--muted)] text-[var(--primary)]  text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                  <Eye className="w-4 h-4" />
                  {title.views?.toFixed(0) || 0}
                </div>
              )}


              {/* Рейтинг */}
              {(
                <div className="absolute gap-1 flex top-2 right-2 z-10 bg-[var(--muted)] text-[var(--primary)] text-xs font-bold p-1 rounded-md shadow-lg">
                  <Star className="w-4 h-4" />
                  {title.averageRating?.toFixed(1) || 0}
                </div>
              )}
              
              <div className="aspect-[3/4] mb-2 sm:mb-3 overflow-hidden rounded relative">
                <Image
                  loader={() => normalizeImageUrl(title?.coverImage? title?.coverImage : "")}
                  src={normalizeImageUrl(title?.coverImage? title?.coverImage : "")}
                  alt={title.name}
                  width={280}
                  height={380}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                    title.ageLimit == 18  ? "blur-md" : ""
                  }`}
                />
                {/* Overlay для блюра взрослого контента */}
                {title.ageLimit == 18  && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="text-white text-sm font-bold bg-red-600 px-3 py-1 rounded">
                      18+
                    </div>
                  </div>
                )}
              </div>
              
              <h3 className={`font-semibold text-[var(--muted-foreground)] truncate text-sm sm:text-base ${
                title.ageLimit == 18  ? "blur-sm" : ""
              }`}>
                {title.name}
              </h3>
              
              {/* Метаданные тайтла */}
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-1">
                {title.releaseYear && (
                  <span className="bg-[var(--secondary)] px-2 py-0.5 rounded">
                    {title.releaseYear}
                  </span>
                )}


                {title.type && (
                  <span className="bg-[var(--secondary)] px-2 py-0.5 rounded">
                    {translateTitleType(String(title.type))}
                  </span>
                )}
              </div>
              
              {title.description && (
                <p className={`text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2 hidden sm:block ${
                  title.ageLimit == 18  ? "blur-sm" : ""
                }`}>
                  {title.description.length > 100 
                    ? `${title.description.substring(0, 100)}...` 
                    : title.description
                  }
                </p>
              )}
            </div>
          ))}
        </div>

        {(!collection.titles || collection.titles.length === 0) && (
          <div className="text-center py-12">
            <p className="text-[var(--muted-foreground)]">
              В этой коллекции пока нет тайтлов.
            </p>
          </div>

        )}
      </div>

      <Footer />

      {/* JSON-LD структурированные данные для SEO */}
      <Script
        id="collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Collection",
            "name": collection.name,
            "description": collection.description,
            "url": `${process.env.NEXT_PUBLIC_URL}/collections/${collectionId}`,
            "image": collection.cover ? `${process.env.NEXT_PUBLIC_URL}${collection.cover}` : `${process.env.NEXT_PUBLIC_URL}/logo/tomilo_color.svg`,
            "numberOfItems": collection.titles?.length || 0,
            "dateCreated": collection.createdAt,
            "dateModified": collection.updatedAt,
            "interactionStatistic": {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/ViewAction",
              "userInteractionCount": collection.views
            },
            "hasPart": collection.titles?.map((title: Title) => ({
              "@type": "CreativeWork",
              "name": title.name,
              "url": `${process.env.NEXT_PUBLIC_URL}${getTitlePath({ id: title._id, slug: title.slug })}`,
              "image": title.coverImage ? `${process.env.NEXT_PUBLIC_URL}${title.coverImage}` : undefined,
              "author": title.author,
              "genre": title.genres
            }))
          })
        }}
      />
    </main>
  );
}
