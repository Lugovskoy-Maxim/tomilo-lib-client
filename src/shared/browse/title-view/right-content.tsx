import { Title, Chapter } from "@/types/title";
import { User } from "@/types/auth";
import { BookOpen, Calendar, CheckCheck, Eye, Loader2 } from "lucide-react";
import { translateTitleType } from "@/lib/title-type-translations";
import { useRouter } from "next/navigation";

interface RightContentProps {
  titleData: Title;
  activeTab: "description" | "chapters" | "comments" | "statistics";
  onTabChange: (
    tab: "description" | "chapters" | "comments" | "statistics"
  ) => void;
  isDescriptionExpanded: boolean;
  onDescriptionToggle: () => void;
  chapters: Chapter[];
  hasMoreChapters: boolean;
  chaptersLoading: boolean;
  onLoadMoreChapters: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: "desc" | "asc";
  onSortChange: (order: "desc" | "asc") => void;
  titleId: string;
  user: User | null;
}

export function RightContent({
  titleData,
  activeTab,
  onTabChange,
  isDescriptionExpanded,
  onDescriptionToggle,
  chapters,
  hasMoreChapters,
  chaptersLoading,
  onLoadMoreChapters,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  titleId,
  user,
}: RightContentProps) {
  const router = useRouter();
  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return (
          <>
            <div className="rounded-xl p-4">
              <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
                Полное описание тайтла
              </h2>
              <div
                className={`text-[var(--foreground)]/80 leading-relaxed ${
                  !isDescriptionExpanded ? "line-clamp-3" : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: titleData?.description || "",
                }}
              />
              {(titleData?.description?.length || 0) > 200 && (
                <button
                  onClick={onDescriptionToggle}
                  className="mt-2 text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
                >
                  {isDescriptionExpanded ? "Свернуть" : "Развернуть"}
                </button>
              )}
            </div>
            <div>Главные герои</div>
            <div>Переводчики</div>
            <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground)]/60 mb-4">
              {titleData?.author && <span>Автор: {titleData.author}</span>}
              {titleData?.artist && <span>Художник: {titleData.artist}</span>}
            </div>
          </>
        );

      case "chapters":
        return (
          <div className="rounded-xl">
            <div className="flex flex-col justify-between bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl items-center p-4">
              {/* <h2 className="text-xl flex items-start w-full mb-2 font-bold text-[var(--foreground)]">
                Главы
              </h2> */}
              {/* Chapter search and sort controls */}
              <div className="flex w-full flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Поиск глав..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    onSortChange(e.target.value as "desc" | "asc")
                  }
                  className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="desc">Сначала новые</option>
                  <option value="asc">Сначала старые</option>
                </select>
              </div>
            </div>

            {/* Chapters list */}
            <div className="space-y-2 mt-2">
              {chapters.map((chapter) => (
                  <div
                    key={chapter._id}
                    className="flex items-center justify-between gap-2 py-2 px-3 bg-[var(--card)]/50 rounded-lg hover:bg-[var(--background)]/70 transition-colors"
                  >
                    {/* Иконка статуса прочтения */}
                    <Eye className="w-5 h-5 text-[var(--primary)]" />
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--foreground)]">
                        {chapter.name}
                      </h3>
                      <p className="text-sm text-[var(--foreground)]/60">
                        {chapter.createdAt
                          ? new Date(chapter.createdAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-2  no-warp">
                        {"Просмотров: "}
                        {chapter.views && (
                          <span className="flex items-center gap-1">
                            {/* <Eye className="w-4 h-4" /> */}
                            {chapter.views}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/read/${titleId}/${chapter._id}`)}
                        className="px-4 py-2 bg-[var(--accent)] cursor-pointer text-[var(--accent-foreground)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors"
                      >
                        Читать
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {hasMoreChapters && (
              <button
                onClick={onLoadMoreChapters}
                disabled={chaptersLoading}
                className="w-full mt-4 py-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg hover:bg-[var(--secondary)]/80 transition-colors disabled:opacity-50"
              >
                {chaptersLoading ? "Загрузка..." : "Загрузить ещё"}
              </button>
            )}
          </div>
        );

      case "comments":
        return (
          <div className="bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl p-4">
            <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
              Комментарии
            </h2>
            <p className="text-[var(--foreground)]/60">
              Комментарии скоро будут доступны
            </p>
          </div>
        );

      case "statistics":
        return (
          <div className="bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl p-4">
            <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
              Статистика
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {titleData?.views || 0}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">
                  Просмотров
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {chapters.length}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">Глав</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-lg text-[var(--primary)]">
            <Calendar className="w-4 h-4" />
            <span>{titleData.releaseYear}</span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-lg text-[var(--primary)]">
            <BookOpen className="w-4 h-4" />
            <span>{translateTitleType(titleData.type || "")}</span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-lg text-[var(--primary)]">
            <CheckCheck className="w-4 h-4" />
            {titleData?.status && <span>{titleData.status}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[var(--background)]/20 px-3 py-1 rounded-lg">
          <span className="text-lg font-bold text-[var(--chart-1)]">
            {titleData?.averageRating
              ? titleData?.averageRating.toFixed(2)
              : "0"}
          </span>
          {/* <button
            type="button"
            onClick={() => setIsRatingOpen((v) => !v)}
            className="px-2 py-1 rounded-lg bg-[var(--background)] text-[var(--primary)] text-xs hover:bg-[var(--background)]/90 transition-colors cursor-pointer"
          >
            Оценить
          </button> */}
        </div>
      </div>

      {/* Блок с цифрами для оценки тайтла */}
      {/* {isRatingOpen && (
        <div className="relative flex flex-col justify-center items-end w-full ">
          <div className="absolute top-0 right-0 flex flex-col w-max bg-[var(--background)]/80 rounded-lg p-2">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm text-[var(--primary)]">Ваша оценка</span>
              <button
                type="button"
                onClick={() => setIsRatingOpen(false)}
                className="p-1 rounded hover:bg-[var(--accent)]"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setPendingRating(n);
                    setIsRatingOpen(false);
                    // Отправляем рейтинг на сервер
                    updateRating({ id: titleData?._id || "", rating: n });
                  }}
                  className={`min-w-8 h-8 px-2 rounded-md text-sm font-medium cursor-pointer ${
                    pendingRating === n
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent)]/80"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )} */}

      {/* Title info */}
      <h1 className="flex items-center justify-center text-3xl font-bold mb-6 text-[var(--foreground)]">
        {titleData?.name}
      </h1>
      {/* Genres */}
      <div className="flex flex-wrap gap-2">
        <span
          className="px-2.5 py-1 cursor-pointer text-red-500 rounded-lg text-sm font-semibold bg-[var(--muted)]/60 p-1"
          onClick={() => {
            router.push(
              `/browse?ageLimit=${encodeURIComponent(
                titleData?.ageLimit || ""
              )}`
            );
          }}
        >
          {titleData?.ageLimit}+
        </span>
        {titleData.genres?.map((genre, index) => (
          <span
            key={index}
            className="px-2 py-1 cursor-pointer rounded-lg text-sm font-normal bg-[var(--muted)]/50 p-1 text-[var(--foreground)]"
            onClick={() => {
              router.push(`/browse?genres=${encodeURIComponent(genre || "")}`);
            }}
          >
            {genre}
          </span>
        ))}
        {titleData.tags?.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 cursor-pointer rounded-lg text-xs font-normal bg-[var(--background)]/50 text-[var(--foreground)]"
            onClick={() => {
              router.push(`/browse?tags=${encodeURIComponent(tag || "")}`);
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-[var(--secondary)]/50 backdrop-blur-sm rounded-lg p-1">
        <div className="flex">
          {[
            { key: "description" as const, label: "Описание" },
            { key: "chapters" as const, label: "Главы" },
            { key: "comments" as const, label: "Комментарии" },
            { key: "statistics" as const, label: "Статистика" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[var(--chart-1)]/40 text-[var(--foreground)]"
                  : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {renderTabContent()}
    </div>
  );
}
