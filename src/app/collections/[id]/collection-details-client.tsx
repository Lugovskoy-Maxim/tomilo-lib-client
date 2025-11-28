"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import { useGetCollectionByIdQuery, useIncrementCollectionViewsMutation } from "@/store/api/collectionsApi";
import { LoadingSkeleton } from "@/shared";

interface CollectionDetailsClientProps {
  collectionId: string;
}

export default function CollectionDetailsClient({ collectionId }: CollectionDetailsClientProps) {
  const router = useRouter();
  const { data: collectionResponse, isLoading, error } = useGetCollectionByIdQuery(collectionId);
  const [incrementViews] = useIncrementCollectionViewsMutation();

  const collection = collectionResponse?.data;

  // SEO для страницы коллекции
  const seoConfig = {
    title: collection?.name || "Коллекция",
    description: collection?.description || "Просмотрите коллекцию тайтлов",
    keywords: "коллекция, тайтлы, манга",
    image: collection?.cover || "/logo/tomilo_color.svg",
  };
  useSEO(seoConfig);

  // Увеличиваем просмотры при загрузке
  useEffect(() => {
    if (collection && collectionId) {
      incrementViews(collectionId);
    }
  }, [collection, collectionId, incrementViews]);

  if (isLoading) {
    return (
      <main className="flex flex-col h-full min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="max-w-7xl mx-auto px-2 py-4">
          <LoadingSkeleton className="h-8 w-64 mb-4" />
          <LoadingSkeleton className="h-32 w-full mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="max-w-7xl mx-auto px-2 py-4 text-center">
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
    <main className="flex flex-col h-full min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-2 py-4">
        {/* Заголовок и информация о коллекции */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--muted-foreground)] mb-2">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-[var(--muted-foreground)] mb-4">
              {collection.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              👁️ {collection.views} просмотров
            </span>
            <span>
              {collection.titles?.length || 0} тайтлов
            </span>
            {collection.createdAt && (
              <span>
                Создано: {new Date(collection.createdAt).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
        </div>

        {/* Сетка тайтлов */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collection.titles?.map((title: Record<string, unknown>) => (
            <div
              key={(title.id as string) || (title._id as string)}
              onClick={() => router.push(`/titles/${(title.id as string) || (title._id as string)}`)}
              className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 hover:border-[var(--primary)] transition-colors cursor-pointer"
            >
              <div className="aspect-[3/4] mb-3 overflow-hidden rounded">
                <img
                  src={(title.cover as string) || (title.image as string) || "/404/image-holder.png"}
                  alt={(title.name as string) || "Тайтл"}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-[var(--muted-foreground)] truncate">
                {(title.name as string) || "Без названия"}
              </h3>
              {(title.description as string) && (
                <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">
                  {title.description as string}
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
    </main>
  );
}
