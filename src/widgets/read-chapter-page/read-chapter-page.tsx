"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { useAuth } from "@/hooks/useAuth";
import { Chapter, ReaderTitle, Title } from "@/types/title";
import { ApiResponse } from "@/types/api";
import { ReaderChapter } from "@/types/chapter";

// Вспомогательная функция нормализации URL
const normalizeAssetUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) {
    return url.replace("/api/browse/", "/uploads/browse/");
  }
  let path = url.startsWith("/") ? url : `/${url}`;

  if (url.includes("uploads")) {
    path = path.replace("/uploads/", "/");
  }
  if (path.includes("/api/browse/")) {
    path = path.replace("/api/browse/", "/uploads/browse/");
  }
  const origin =
    process.env.NEXT_PUBLIC_UPLOADS_URL || "http://localhost:3001/uploads";
  return `${origin}${path}`;
};

export default function ChapterReader() {
  const params = useParams();
  const router = useRouter();
  const { user, updateChapterViews, addToReadingHistory } = useAuth();

  const titleId = params.titleId as string;
  const chapterId = params.chapterId as string;

  // Загрузка данных с правильной типизацией
  const { data: titleData, isLoading: titleLoading } =
    useGetTitleByIdQuery(titleId);
  const { data: chaptersData, isLoading: chaptersLoading } =
    useGetChaptersByTitleQuery({
      titleId,
      sortOrder: "asc",
    });

  // Типизированные данные
  const typedTitleData = titleData as ApiResponse<Title> | undefined;
  const typedChaptersData = chaptersData as Chapter[] | undefined;

  // Мемоизация преобразованных данных
  const chapters = useMemo((): ReaderChapter[] => {
    if (!typedChaptersData) return [];
    return typedChaptersData.map((ch: Chapter) => ({
      _id: ch._id,
      number: Number(ch.chapterNumber) || 0,
      title: ch.name || "",
      date: ch.releaseDate || "",
      views: Number(ch.views) || 0,
      images: Array.isArray(ch.pages) ? ch.pages.map(normalizeAssetUrl) : [],
    }));
  }, [typedChaptersData]);

  const title = useMemo((): ReaderTitle | null => {
    if (!typedTitleData?.data) return null;
    const data = typedTitleData.data;
    return {
      _id: data._id,
      title: data.name,
      originalTitle: data.altNames?.[0] || "",
      type: data.type || "Неизвестно",
      year: Number(data.releaseYear) || new Date().getFullYear(),
      rating: Number(data.rating) || 0,
      image: normalizeAssetUrl(data.coverImage || ""),
      genres: data.genres || [],
      description: data.description || "",
      status: data.status || "ongoing",
      author: data.author || "",
      artist: data.artist || "",
      totalChapters: Number(data.totalChapters) || 0,
      views: Number(data.views) || 0,
      lastUpdate: data.updatedAt || "",
      chapters: [],
      alternativeTitles: data.altNames || [],
    };
  }, [typedTitleData]);

  // Находим текущую главу и её индекс
  const { currentChapter, currentChapterIndex } = useMemo(() => {
    const foundChapter =
      chapters.find((ch) => ch._id === chapterId) || chapters[0];
    const foundIndex = chapters.findIndex((ch) => ch._id === chapterId);
    return {
      currentChapter: foundChapter,
      currentChapterIndex: foundIndex !== -1 ? foundIndex : 0,
    };
  }, [chapters, chapterId]);

  // Состояния
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(
    new Set()
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs для предотвращения повторных вызовов
  const containerRef = useRef<HTMLDivElement>(null);
  const historyAddedRef = useRef<Set<string>>(new Set());
  const viewsUpdatedRef = useRef<Set<string>>(new Set());

  // Обновление просмотров и истории чтения (без бесконечного цикла)
  useEffect(() => {
    if (!currentChapter?._id || !title?._id) return;

    const chapterKey = `${title._id}-${currentChapter._id}`;

    // Обновляем просмотры только один раз
    if (!viewsUpdatedRef.current.has(chapterKey)) {
      updateChapterViews(currentChapter._id, currentChapter.views)
        .then(() => {
          viewsUpdatedRef.current.add(chapterKey);
        })
        .catch(console.error);
    }

    // Добавляем в историю чтения только один раз
    if (!historyAddedRef.current.has(chapterKey)) {
      addToReadingHistory(title._id.toString(), currentChapter._id.toString())
        .then(() => {
          historyAddedRef.current.add(chapterKey);
        })
        .catch(console.error);
    }
  }, [currentChapter, title, updateChapterViews, addToReadingHistory]);

  // Обработчик ошибок загрузки изображений
  const handleImageError = useCallback((imageIndex: number) => {
    setImageLoadErrors((prev) => new Set(prev).add(imageIndex));
  }, []);

  // Навигация по клавиатуре
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            router.push(`/browse/${titleId}/chapter/${prevChapter._id}`);
          }
          break;
        case "ArrowRight":
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            router.push(`/browse/${titleId}/chapter/${nextChapter._id}`);
          }
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentChapterIndex, chapters, titleId, router]);

  // Полноэкранный режим
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const loading = titleLoading || chaptersLoading || !currentChapter;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!title || !currentChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Глава не найдена
          </h1>
          <p className="text-gray-400">
            Попробуйте обновить страницу или выбрать другую главу
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Хедер */}
      <header className="fixed top-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm z-50 border-b border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/browse/${titleId}`)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                ← Назад
              </button>

              {/* Изображение тайтла */}
              {title.image && (
                <div className="relative w-10 h-12 flex-shrink-0">
                  <Image
                    src={title.image}
                    alt={title.title}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1
                  className="font-semibold text-lg truncate"
                  title={title.title}
                >
                  {title.title}
                </h1>
                <p className="text-gray-400 text-sm truncate">
                  Глава {currentChapter.number}{" "}
                  {currentChapter.title && `- ${currentChapter.title}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title={
                  isFullscreen
                    ? "Выйти из полноэкранного режима"
                    : "Полноэкранный режим"
                }
              >
                {isFullscreen ? "⤵️" : "⤴️"}
              </button>

              <select
                value={currentChapter._id}
                onChange={(e) =>
                  router.push(`/browse/${titleId}/chapter/${e.target.value}`)
                }
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                {chapters.map((chapter) => (
                  <option key={chapter._id} value={chapter._id}>
                    Глава {chapter.number}{" "}
                    {chapter.title && `- ${chapter.title}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main ref={containerRef} className="pt-16 pb-8">
        {/* Навигация в начале главы */}
        <div className="flex justify-between items-center p-6 container mx-auto">
          {currentChapterIndex > 0 ? (
            <button
              onClick={() => {
                const prevChapter = chapters[currentChapterIndex - 1];
                router.push(`/browse/${titleId}/chapter/${prevChapter._id}`);
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span>←</span>
              <div className="text-left">
                <div className="text-sm text-gray-400">Предыдущая</div>
                <div className="font-semibold">
                  Глава {chapters[currentChapterIndex - 1].number}
                </div>
              </div>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center space-x-4">
            {/* Кнопка возврата к тайтлу */}
            <button
              onClick={() => router.push(`/browse/${titleId}`)}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <span>📚</span>
              <div className="text-center">
                <div className="text-sm text-green-200">К тайтлу</div>
                <div className="font-semibold">{title.title}</div>
              </div>
            </button>

            {currentChapterIndex < chapters.length - 1 ? (
              <button
                onClick={() => {
                  const nextChapter = chapters[currentChapterIndex + 1];
                  router.push(`/browse/${titleId}/chapter/${nextChapter._id}`);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <div className="text-right">
                  <div className="text-sm text-blue-200">Следующая</div>
                  <div className="font-semibold">
                    Глава {chapters[currentChapterIndex + 1].number}
                  </div>
                </div>
                <span>→</span>
              </button>
            ) : (
              <div className="text-center px-6 py-3 bg-purple-600 rounded-lg">
                <div className="text-sm text-purple-200">Поздравляем!</div>
                <div className="font-semibold">Вы прочитали все главы</div>
              </div>
            )}
          </div>
        </div>

        {/* Изображения текущей главы */}
        <div className="space-y-4 container mx-auto px-4">
          {currentChapter.images.map((src, imageIndex) => (
            <div key={imageIndex} className="flex justify-center">
              <div className="relative max-w-4xl w-full">
                {!imageLoadErrors.has(imageIndex) ? (
                  <Image
                    src={src}
                    alt={`Страница ${imageIndex + 1}`}
                    width={1200}
                    height={1600}
                    className="w-full h-auto shadow-2xl"
                    quality={85}
                    loading={imageIndex < 3 ? "eager" : "lazy"}
                    onError={() => handleImageError(imageIndex)}
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-red-400">Ошибка загрузки</div>
                      <button
                        onClick={() => {
                          setImageLoadErrors((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(imageIndex);
                            return newSet;
                          });
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        Повторить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Навигация в конце главы */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700 container mx-auto px-4">
          {currentChapterIndex > 0 ? (
            <button
              onClick={() => {
                const prevChapter = chapters[currentChapterIndex - 1];
                router.push(`/browse/${titleId}/chapter/${prevChapter._id}`);
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span>←</span>
              <div className="text-left">
                <div className="text-sm text-gray-400">Предыдущая</div>
                <div className="font-semibold">
                  Глава {chapters[currentChapterIndex - 1].number}
                </div>
              </div>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center space-x-4">
            {/* Кнопка возврата к тайтлу */}
            <button
              onClick={() => router.push(`/browse/${titleId}`)}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <span>📚</span>
              <div className="text-center">
                <div className="text-sm text-green-200">К тайтлу</div>
                <div className="font-semibold">{title.title}</div>
              </div>
            </button>

            {currentChapterIndex < chapters.length - 1 ? (
              <button
                onClick={() => {
                  const nextChapter = chapters[currentChapterIndex + 1];
                  router.push(`/browse/${titleId}/chapter/${nextChapter._id}`);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <div className="text-right">
                  <div className="text-sm text-blue-200">Следующая</div>
                  <div className="font-semibold">
                    Глава {chapters[currentChapterIndex + 1].number}
                  </div>
                </div>
                <span>→</span>
              </button>
            ) : (
              <div className="text-center px-6 py-3 bg-purple-600 rounded-lg">
                <div className="text-sm text-purple-200">Поздравляем!</div>
                <div className="font-semibold">Вы прочитали все главы</div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Используйте ← → для навигации между главами</p>
        </div>
      </footer>
    </div>
  );
}
