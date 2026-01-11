"use client";
import React from "react";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/shared";
import { useGetCollectionsQuery } from "@/store/api/collectionsApi";
import Image from "next/image";
import { CollectionsQuery, Collection } from "@/types/collection";

export type CollectionsFilters = CollectionsQuery;

function CollectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = useMemo(() => {
    const p = Number(searchParams.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  // Запрос коллекций с параметрами
  const { data: collectionsResponse, isLoading, error } = useGetCollectionsQuery({
    page,
    limit: 12,
  });

  const collections = collectionsResponse?.data?.collections || [];
  const totalCollections = collectionsResponse?.data?.total || 0;
  const currentPage = collectionsResponse?.data?.page || page;
  const totalPages = collectionsResponse?.data?.totalPages || 1;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    const newUrl = params.toString()
      ? `/collections?${params.toString()}`
      : "/collections";
    router.replace(newUrl, { scroll: false });
  };

  // Обработчик клика по карточке коллекции
  const handleCardClick = (id: string) => {
    router.push(`/collections/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-[var(--card)] rounded-lg animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-[var(--card)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)] mb-4">
          Не удалось загрузить коллекции
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Основной контент */}
      <div>
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--muted-foreground)] mb-2">
            Коллекции
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Найдено {totalCollections} коллекций
          </p>
        </div>

        {/* Сетка коллекций */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection: Collection) => (
            <div
              key={collection.id}
              onClick={() => handleCardClick(collection.id)}
              className=" rounded-lg p-4 border border-transparent hover:border-[var(--chart-1)] transition-colors cursor-pointer"
            >
              {collection.cover && (
                <div className="mb-3">
                  <Image
                  loader={()=> {return process.env.NEXT_PUBLIC_URL+collection.cover}}
                    src={process.env.NEXT_PUBLIC_URL+collection.cover}
                    alt={collection.name}
                    width={328}
                    height={328}
                    className="w-full h-90 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex justify-between items-start mb-3">
                <h3 className="flex w-full text-xl font-semibold justify-center items-center text-[var(--muted-foreground)] truncate">
                  {collection.name}
                </h3>
              </div>

              {collection.description && (
                <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                  {collection.description}
                </p>
              )}

              <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <span>👁️</span>
                  {collection.views} просмотров
                </span>
                <span>
                  {collection.titles?.length || 0} тайтлов
                </span>
              </div>

              {collection.createdAt && (
                <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Создано: {new Date(collection.createdAt).toLocaleDateString('ru-RU')}
                </div>
              )}
            </div>
          ))}
        </div>

        {collections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--muted-foreground)] mb-4">
              Коллекции не найдены
            </p>
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}

export default CollectionsContent;
