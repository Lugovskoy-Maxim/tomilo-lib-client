"use client";
import { useState, useMemo, useCallback } from "react";
import { Footer, Header } from "@/widgets";
import {
  Star,
  Calendar,
  User,
  Tag,
  Clock,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Title } from "@/constants/mokeReadPage";
import Image from "next/image";
import TitleActions from "../title-actions/title-actions";
import ChapterSearchInput from "../chapter-search-input/chapter-search-input";
import TitleHeader from "../title-header/title-header";
import {
  ChapterItem,
  CommentItem,
  InfoCard,
  StatusBadge,
  TabButton,
} from "../ui-components/ui-components";

interface TitlePageContentProps {
  title: Title;
}

export default function TitlePageContent({ title }: TitlePageContentProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "chapters" | "comments">(
    "chapters"
  );
  const [chapterSearch, setChapterSearch] = useState("");
  const router = useRouter();

  // Функция поиска с useCallback для стабильной ссылки
  const SearchTitleChapters = useCallback(
    (chapters: typeof title.chapters, query: string) => {
      if (!query.trim()) return chapters;

      const searchLower = query.toLowerCase().trim();

      return chapters.filter((chapter) => {
        // Поиск по номеру
        if (chapter.number.toString().includes(query)) {
          return true;
        }

        // Поиск по названию
        if (chapter.title?.toLowerCase().includes(searchLower)) {
          return true;
        }

        // Поиск по комбинированной строке
        const combinedString = `глава ${chapter.number} ${
          chapter.title || ""
        }`.toLowerCase();
        if (combinedString.includes(searchLower)) {
          return true;
        }

        return false;
      });
    },
    [title]
  );

  // Логика последней прочитанной главы
  const getLastReadChapter = (): number | null => {
    if (typeof window === "undefined") return null;
    const lastRead = localStorage.getItem(`lastRead_${title.id}`);
    return lastRead ? parseInt(lastRead, 10) : null;
  };

  const [lastReadChapter, setLastReadChapter] = useState<number | null>(() =>
    getLastReadChapter()
  );

  const saveLastReadChapter = (chapterNumber: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`lastRead_${title.id}`, chapterNumber.toString());
    }
    setLastReadChapter(chapterNumber);
  };

  // Фильтрация глав с использованием useMemo
  const filteredChapters = useMemo(() => {
    return SearchTitleChapters(title.chapters, chapterSearch);
  }, [SearchTitleChapters, chapterSearch, title.chapters]);

  // Логика для кнопки чтения - ИСПРАВЛЕНО: первая глава должна быть первой в массиве
  const getReadingButtonConfig = () => {
    if (lastReadChapter) {
      const lastChapterExists = title.chapters.some(
        (chapter) => chapter.number === lastReadChapter
      );

      if (lastChapterExists) {
        return {
          text: "Продолжить чтение",
          chapterNumber: lastReadChapter,
          subText: `Глава ${lastReadChapter}`,
        };
      }
    }

    // первая глава - это последняя в массиве
    const firstChapter = title.chapters[title.chapters.length - 1];
    return {
      text: "Начать чтение",
      chapterNumber: firstChapter.number,
      subText: "С первой главы",
    };
  };

  const readingButtonConfig = getReadingButtonConfig();

  const handleReadingButtonClick = () => {
    router.push(
      `/read/${title.id}/chapter/${readingButtonConfig.chapterNumber}`
    );
  };

  const handleChapterClick = (chapterNumber: number) => {
    saveLastReadChapter(chapterNumber);
    router.push(`/browse/${title.id}/chapter/${chapterNumber}`);
  };

  // Боковая панель
  const Sidebar = () => (
    <div className="sticky top-20 space-y-6">
      {/* Постер */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)]">
        <Image
          src={title.image}
          alt={title.title}
          className="w-full h-full object-cover"
          priority={true}
          width={280}
          height={400}
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={title.status} />
        </div>
      </div>

      {/* Кнопки действий */}
      <TitleActions
        onReadingClick={handleReadingButtonClick}
        onBookmarkToggle={() => setIsBookmarked(!isBookmarked)}
        isBookmarked={isBookmarked}
        buttonText={readingButtonConfig.text}
        buttonSubText={readingButtonConfig.subText}
      />

      {/* Информационный блок */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center text-center p-3 bg-[var(--accent)] rounded-lg">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {title.totalChapters}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">глав</div>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-[var(--accent)] rounded-lg">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {(title.views / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              просмотров
            </div>
          </div>
        </div>
      </div>

      {/* Альтернативные названия */}
      {(title.alternativeTitles || title.originalTitle) && (
        <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
            Альтернативные названия
          </h3>
          <div className="space-y-2">
            {title.alternativeTitles?.map((altTitle, index) => (
              <div key={index} className="text-sm text-[var(--foreground)]">
                {altTitle}
              </div>
            ))}
            {title.originalTitle && !title.alternativeTitles && (
              <div className="text-sm text-[var(--foreground)]">
                {title.originalTitle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Источники */}
      {title.sources && title.sources.length > 0 && (
        <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
            Источники
          </h3>
          <div className="space-y-2">
            {title.sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded hover:bg-[var(--accent)] transition-colors group"
              >
                <span className="text-sm text-[var(--foreground)]">
                  {source.name}
                </span>
                <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)]" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Контент табов
  const TabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <div className="flex flex-col prose prose-invert max-w-none gap-4">
            <p className="text-[var(--foreground)] leading-relaxed">
              {title.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon={User} label="Автор" value={title.author} />
              <InfoCard icon={Tag} label="Художник" value={title.artist} />
            </div>
          </div>
        );

      case "chapters":
        return (
          <div className="space-y-4">
            {/* Поиск глав - теперь контролируемый */}
            <ChapterSearchInput
              value={chapterSearch} // Передаем текущее значение
              onSearch={setChapterSearch} // Обновляем состояние
              placeholder="Поиск по номеру или названию главы..."
            />

            {/* Остальной код без изменений */}
            <div className="space-y-2">
              {filteredChapters.length > 0 ? (
                filteredChapters.map((chapter) => (
                  <ChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    onClick={handleChapterClick}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  Главы не найдены
                </div>
              )}
            </div>
          </div>
        );

      case "comments":
        return (
          <div className="space-y-6">
            {/* Форма добавления комментария */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Оставить комментарий
              </h3>
              <textarea
                placeholder="Поделитесь вашим мнением о тайтле..."
                className="w-full h-32 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg resize-none focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-[var(--muted-foreground)]">
                  Максимум 1000 символов
                </div>
                <button className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--primary)]/90 transition-colors">
                  Отправить
                </button>
              </div>
            </div>

            {/* Список комментариев */}
            <div className="space-y-4">
              <CommentItem
                author="Алексей"
                time="2 часа назад"
                content="Отличный тайтл! Сюжет затягивает с первых глав, а арты просто шикарные. Жду не дождусь продолжения."
                likes={24}
              />
              <CommentItem
                author="Мария"
                time="5 часов назад"
                content="Главная героиня просто прекрасна! Её развитие на протяжении сюжета впечатляет. Рекомендую всем любителям фэнтези."
                likes={18}
                avatarColor="bg-green-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <TitleHeader title={title.title} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Левая колонка */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>

          {/* Правая колонка */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Заголовок и рейтинг */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-2">
                  {title.title}
                </h1>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1 bg-[var(--card)] px-3 py-1 rounded-full border border-[var(--border)]">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{title.rating}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{title.year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{title.lastUpdate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      <span>{title.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Жанры */}
              <div>
                <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Жанры
                </h3>
                <div className="flex flex-wrap gap-2">
                  {title.genres.map((genre, index) => (
                    <Link
                      key={index}
                      href={`/browse?genres=${encodeURIComponent(genre)}`}
                      className="px-3 py-1 bg-[var(--accent)] text-[var(--foreground)] rounded-full text-sm border border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Табы */}
              <div className="border-b border-[var(--border)] mb-6">
                <div className="flex gap-8">
                  <TabButton
                    active={activeTab === "info"}
                    onClick={() => setActiveTab("info")}
                  >
                    Описание
                  </TabButton>
                  <TabButton
                    active={activeTab === "chapters"}
                    onClick={() => setActiveTab("chapters")}
                  >
                    Главы ({title.chapters.length})
                  </TabButton>
                  <TabButton
                    active={activeTab === "comments"}
                    onClick={() => setActiveTab("comments")}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Комментарии
                    </div>
                  </TabButton>
                </div>
              </div>

              {/* Контент табов */}
              <div className="mb-8">
                <TabContent />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
