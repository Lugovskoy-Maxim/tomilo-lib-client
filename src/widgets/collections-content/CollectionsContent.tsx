"use client";
import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Library, RefreshCw } from "lucide-react";
import { Pagination, CollectionCard } from "@/shared";
import { useGetCollectionsQuery } from "@/store/api/collectionsApi";
import { CollectionsQuery, Collection } from "@/types/collection";

export type CollectionsFilters = CollectionsQuery;

function CollectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = useMemo(() => {
    const p = Number(searchParams.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const {
    data: collectionsResponse,
    isLoading,
    error,
  } = useGetCollectionsQuery({
    page,
    limit: 12,
  });

  const collections = collectionsResponse?.data?.collections || [];
  const totalCollections = collectionsResponse?.data?.total || 0;
  const currentPage = collectionsResponse?.data?.page || page;
  const totalPages = collectionsResponse?.data?.totalPages || 1;

  const handlePageChange = (pageNum: number) => {
    const params = new URLSearchParams();
    if (pageNum > 1) params.set("page", pageNum.toString());
    const newUrl = params.toString() ? `/collections?${params.toString()}` : "/collections";
    router.replace(newUrl, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-6 w-40 bg-[var(--muted)] rounded-xl animate-pulse" />
          <div className="h-5 w-24 bg-[var(--muted)]/70 rounded-lg animate-pulse" />
        </div>
        <div className="grid gap-5 sm:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] bg-[var(--card)] rounded-2xl animate-pulse border border-[var(--border)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 sm:p-12 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--destructive)]/10 text-[var(--destructive)] mb-4">
          <Library className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Не удалось загрузить коллекции
        </h2>
        <p className="text-[var(--muted-foreground)] text-sm mb-6 max-w-sm mx-auto">
          Проверьте соединение и попробуйте обновить страницу.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-medium text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Bar: count + optional filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[var(--muted-foreground)] text-sm sm:text-base">
          <span className="font-medium text-[var(--foreground)]">{totalCollections}</span>{" "}
          {totalCollections === 1 ? "коллекция" : totalCollections < 5 ? "коллекции" : "коллекций"}
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {collections.map((collection: Collection) => (
          <CollectionCard key={collection.id} data={collection} variant="grid" />
        ))}
      </div>

      {collections.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 sm:p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)] mb-4">
            <Library className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Коллекции не найдены
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm">
            Пока нет ни одной подборки. Загляните позже.
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

export default CollectionsContent;
