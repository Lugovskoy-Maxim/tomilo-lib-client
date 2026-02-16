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
import { ArrowLeft, Eye, FolderX, Star } from "lucide-react";
import { getTitlePath } from "@/lib/title-paths";
import { useAuth } from "@/hooks/useAuth";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import Script from "next/script";
import { translateTitleType } from "@/lib/title-type-translations";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";

export default function CollectionDetails({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: collectionResponse, isLoading, error } = useGetCollectionByIdQuery(collectionId);
  const [incrementViews] = useIncrementCollectionViewsMutation();

  const collection = collectionResponse?.data;

  // Флаг для предотвращения множественных инкрементов просмотров
  const hasIncrementedViewsRef = useRef(false);

  // Age verification state
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);

  // Check age verification on component mount
  useEffect(() => {
    const verified = checkAgeVerification(user);
    setIsAgeVerified(verified);

    // If collection has 18+ content and is not verified, show modal
    const hasAdultContent =
      collection?.titles?.some((title: Title) => title.ageLimit === 18) || false;
    if (hasAdultContent && !verified) {
      setShowAgeModal(true);
    }
  }, [user, collection]);

  // Check if collection has adult content
  const handleAgeVerification = () => {
    setIsAgeVerified(true);
    setShowAgeModal(false);
  };

  const handleAgeVerificationCancel = () => {
    setShowAgeModal(false);
    router.push("/collections");
  };

  // SEO для страницы коллекции
  const seoConfig = useMemo(
    () => ({
      title: collection?.name || "Коллекция",
      description: collection?.description || "Просмотрите коллекцию тайтлов",
      keywords: "коллекция, тайтлы, манга",
      image: collection?.cover || "/logo/tomilo_color.svg",
    }),
    [collection?.name, collection?.description, collection?.cover],
  );

  useSEO(seoConfig);

  const normalizeImageUrl = (cover: string) => {
    return cover ? process.env.NEXT_PUBLIC_URL + cover : "/404/image-holder.png";
  };

  // Увеличиваем просмотры при загрузке
  useEffect(() => {
    if (collectionId && !hasIncrementedViewsRef.current) {
      incrementViews(collectionId);
      hasIncrementedViewsRef.current = true;
    }
  }, [collectionId, incrementViews]);

  // Helper function to determine if content should be hidden
  const shouldHideContent = (title: Title) => {
    return title.ageLimit === 18 && !isAgeVerified;
  };

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
      <main className="flex flex-col min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-lg ring-1 ring-white/5">
                <FolderX className="w-16 h-16 text-[var(--muted-foreground)]/70" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-3">
              Коллекция не найдена
            </h1>
            <p className="text-[var(--muted-foreground)] mb-10 leading-relaxed">
              Возможно, она была удалена или ссылка неверна. Вернитесь к списку коллекций.
            </p>
            <button
              onClick={() => router.push("/collections")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              Вернуться к коллекциям
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] mb-10">
      <Header />
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 py-4">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Коллекции", href: "/collections" },
            { name: collection?.name || "Коллекция", isCurrent: true },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 py-4">
        {/* Карточка-хедер коллекции */}
        <div className="mb-8 rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-xl ring-1 ring-white/5">
          <div className="flex flex-col lg:flex-row gap-0">
            <div className="flex-1 min-w-0 p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-2 break-words">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-[var(--muted-foreground)] mb-4 leading-relaxed text-sm sm:text-base">
                  {collection.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <Eye className="w-4 h-4 text-[var(--primary)]" />
                  {collection.views} просмотров
                </span>
                <span className="whitespace-nowrap">{collection.titles?.length || 0} тайтлов</span>
                {collection.createdAt && (
                  <span className="whitespace-nowrap">
                    Создано: {new Date(collection.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                )}
              </div>
            </div>
            {collection.cover && (
              <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end p-4 lg:p-6">
                <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/10 aspect-square w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52">
                  <Image
                    loader={({ src, width }) => `${src}?w=${width}`}
                    src={normalizeImageUrl(collection.cover)}
                    alt={collection.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 176px, 208px"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Сетка тайтлов */}
        <div className="pb-6 grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
          {collection.titles?.map((title: Title) => {
            const isContentHidden = shouldHideContent(title);

            return (
              <div
                key={title._id}
                onClick={() =>
                  !isContentHidden && router.push(getTitlePath({ id: title._id, slug: title.slug }))
                }
                className={`bg-[var(--card)] max-h-[580px] overflow-hidden rounded-2xl border border-[var(--border)] p-2 sm:p-3 card-hover-soft cursor-pointer group relative ${
                  isContentHidden ? "cursor-not-allowed opacity-75" : ""
                }`}
              >
                {/* Views */}
                <div className="absolute flex gap-1 top-2 left-2 z-10 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-xl border border-white/20 shadow-lg">
                  <Eye className="w-3.5 h-3.5" />
                  {title.views?.toFixed(0) || 0}
                </div>

                {/* Rating */}
                <div className="absolute gap-1 flex top-2 right-2 z-10 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-xl border border-white/20 shadow-lg">
                  <Star className="w-3.5 h-3.5" />
                  {title.averageRating?.toFixed(1) || 0}
                </div>

                <div className="aspect-[3/4] mb-2 sm:mb-3 overflow-hidden rounded-xl relative">
                  <Image
                    loader={() => normalizeImageUrl(title?.coverImage || "")}
                    src={normalizeImageUrl(title?.coverImage || "")}
                    alt={title.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 280px"
                    className={`object-cover card-media-hover ${
                      isContentHidden ? "blur-md" : ""
                    }`}
                  />
                  {isContentHidden && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                        <span>18+</span>
                      </div>
                    </div>
                  )}
                </div>

                <h3
                  className={`font-semibold text-[var(--foreground)] truncate text-sm sm:text-base group-hover:text-[var(--primary)] transition-colors ${
                    isContentHidden ? "blur-sm" : ""
                  }`}
                >
                  {title.name}
                </h3>

                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-1 flex-wrap">
                  {title.releaseYear && (
                    <span className="bg-[var(--secondary)] px-2 py-0.5 rounded-lg">
                      {title.releaseYear}
                    </span>
                  )}
                  {title.type && (
                    <span className="bg-[var(--secondary)] px-2 py-0.5 rounded-lg">
                      {translateTitleType(String(title.type))}
                    </span>
                  )}
                </div>

                {title.description && (
                  <p
                    className={`text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2 hidden sm:block ${
                      isContentHidden ? "blur-sm" : ""
                    }`}
                  >
                    {title.description.length > 100
                      ? `${title.description.substring(0, 100)}...`
                      : title.description}
                  </p>
                )}

                {isContentHidden && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="bg-[var(--card)] p-4 rounded-2xl text-center max-w-xs border border-[var(--border)] shadow-xl">
                      <p className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
                        Для просмотра этого контента необходимо подтвердить возраст 18+
                      </p>
                      <button
                        onClick={() => setShowAgeModal(true)}
                        className="px-4 py-2 bg-[var(--primary)] text-primary-foreground text-sm rounded-xl hover:opacity-90 transition-opacity font-medium"
                      >
                        Подтвердить возраст
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(!collection.titles || collection.titles.length === 0) && (
          <div className="text-center py-16 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[var(--muted-foreground)]">В этой коллекции пока нет тайтлов.</p>
          </div>
        )}
      </div>

      <Footer />

      {/* Age Verification Modal */}
      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleAgeVerification}
        onCancel={handleAgeVerificationCancel}
      />

      {/* JSON-LD структурированные данные для SEO */}
      <Script
        id="collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Collection",
            name: collection.name,
            description: collection.description,
            url: `${process.env.NEXT_PUBLIC_URL}/collections/${collectionId}`,
            image: collection.cover
              ? `${process.env.NEXT_PUBLIC_URL}${collection.cover}`
              : `${process.env.NEXT_PUBLIC_URL}/logo/tomilo_color.svg`,
            numberOfItems: collection.titles?.length || 0,
            dateCreated: collection.createdAt,
            dateModified: collection.updatedAt,
            interactionStatistic: {
              "@type": "InteractionCounter",
              interactionType: "https://schema.org/ViewAction",
              userInteractionCount: collection.views,
            },
            hasPart: collection.titles?.map((title: Title) => ({
              "@type": "CreativeWork",
              name: title.name,
              url: `${process.env.NEXT_PUBLIC_URL}${getTitlePath({ id: title._id, slug: title.slug })}`,
              image: title.coverImage
                ? `${process.env.NEXT_PUBLIC_URL}${title.coverImage}`
                : undefined,
              author: title.author,
              genre: title.genres,
            })),
          }),
        }}
      />
    </main>
  );
}
