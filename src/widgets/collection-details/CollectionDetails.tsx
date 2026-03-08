"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import {
  useGetCollectionByIdQuery,
  useIncrementCollectionViewsMutation,
} from "@/store/api/collectionsApi";
import LoadingSkeleton from "@/shared/skeleton/skeleton";
import { Title } from "@/types/title";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { ArrowLeft, Eye, FolderX, Star } from "lucide-react";
import { getTitlePath } from "@/lib/title-paths";
import { useAuth } from "@/hooks/useAuth";
import { AgeVerificationModal, checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import Script from "next/script";
import { translateTitleType } from "@/lib/title-type-translations";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { getCoverUrl, getCoverUrls } from "@/lib/asset-url";

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

  const userId = user?._id ?? null;
  const userBirthDate = user?.birthDate ?? null;
  useEffect(() => {
    const verified = checkAgeVerification(user);
    setIsAgeVerified(prev => (prev === verified ? prev : verified));

    const hasAdultContent =
      collection?.titles?.some((title: Title) => title.ageLimit === 18) || false;
    if (hasAdultContent && !verified) {
      setShowAgeModal(true);
    }
  }, [userId, userBirthDate, collection]);

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

  const normalizeImageUrls = (cover: string) => {
    return getCoverUrls(cover, "/404/image-holder.png");
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <LoadingSkeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
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
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Коллекции", href: "/collections" },
            { name: collection?.name || "Коллекция", isCurrent: true },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 pb-10">
        {/* Карточка-хедер коллекции */}
        <div className="mb-6 sm:mb-8 rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-sm">
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
                  <OptimizedImage
                    src={normalizeImageUrls(collection.cover).primary}
                    fallbackSrc={normalizeImageUrls(collection.cover).fallback}
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Сетка тайтлов — карточки каталога */}
        <div className="pb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {collection.titles?.map((title: Title) => {
            const isContentHidden = shouldHideContent(title);
            const titlePath = getTitlePath({ id: title._id, slug: title.slug });

            const cardInner = (
              <>
                <div className="relative overflow-hidden rounded-xl bg-[var(--muted)]/30 aspect-[2/3] flex-shrink-0">
                  <OptimizedImage
                    src={normalizeImageUrls(title?.coverImage || "").primary}
                    fallbackSrc={normalizeImageUrls(title?.coverImage || "").fallback}
                    alt={title.name}
                    fill
                    className={`object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                      isContentHidden ? "blur-md" : ""
                    }`}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] sm:text-xs font-medium">
                    <span className="flex items-center gap-1 truncate min-w-0">
                      <Eye className="w-3 h-3 flex-shrink-0" />
                      {title.views?.toLocaleString() ?? 0}
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3 h-3" />
                      {(title.averageRating ?? 0).toFixed(1)}
                    </span>
                  </div>
                  {isContentHidden && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium sm:font-bold shadow-lg border flex items-center gap-1 sm:gap-1.5">
                        <span>18+</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0 p-2 sm:p-2.5 flex-1">
                  <h3
                    className={`font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-snug group-hover:text-[var(--primary)] transition-colors ${
                      isContentHidden ? "blur-sm" : ""
                    }`}
                    title={title.name}
                  >
                    {title.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {title.releaseYear != null && (
                      <span className="text-[10px] sm:text-xs text-[var(--muted-foreground)] bg-[var(--secondary)]/80 px-1.5 py-0.5 rounded-md">
                        {title.releaseYear}
                      </span>
                    )}
                    {title.type && (
                      <span className="text-[10px] sm:text-xs text-[var(--muted-foreground)] bg-[var(--secondary)]/80 px-1.5 py-0.5 rounded-md">
                        {translateTitleType(String(title.type))}
                      </span>
                    )}
                  </div>
                  {title.description && (
                    <p
                      className={`text-xs text-[var(--muted-foreground)] mt-1.5 line-clamp-2 leading-snug hidden sm:block ${
                        isContentHidden ? "blur-sm" : ""
                      }`}
                    >
                      {title.description.length > 120
                        ? `${title.description.slice(0, 120)}…`
                        : title.description}
                    </p>
                  )}
                </div>
              </>
            );

            if (isContentHidden) {
              return (
                <div
                  key={title._id}
                  className="relative isolate flex flex-col h-full rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden card-hover-soft cursor-not-allowed transition-[box-shadow] duration-250"
                >
                  {cardInner}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
                    <div className="bg-[var(--card)] p-4 rounded-xl text-center max-w-[240px] border border-[var(--border)] shadow-xl mx-2">
                      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-3">
                        Подтвердите возраст 18+ для просмотра
                      </p>
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          setShowAgeModal(true);
                        }}
                        className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        Подтвердить
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={title._id}
                href={titlePath}
                className="relative isolate flex flex-col h-full rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden card-hover-soft cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 transition-[box-shadow] duration-250 hover:shadow-[0_12px_24px_rgb(0_0_0/0.1),0_4px_8px_rgb(0_0_0/0.06)] dark:hover:shadow-[0_14px_28px_rgb(0_0_0/0.4),0_6px_12px_rgb(0_0_0/0.25)]"
              >
                {cardInner}
              </Link>
            );
          })}
        </div>

        {(!collection.titles || collection.titles.length === 0) && (
          <div className="text-center py-14 sm:py-16 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[var(--muted-foreground)] text-sm sm:text-base">
              В этой коллекции пока нет тайтлов.
            </p>
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
              ? getCoverUrl(collection.cover)
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
              image: title.coverImage ? getCoverUrl(title.coverImage) : undefined,
              author: title.author,
              genre: title.genres,
            })),
          }),
        }}
      />
    </main>
  );
}
