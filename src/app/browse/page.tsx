"use client";
import { useState, useMemo } from "react";
import { Footer, Header } from "@/widgets";
import {
  Star,
  Calendar,
  User,
  Tag,
  Play,
  Bookmark,
  Heart,
  Clock,
  ChevronLeft,
  ExternalLink,
  MessageSquare,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mockTitle, Title } from "@/constants/mokeReadPage";
import Image from "next/image";

// Переисполняемые компоненты
const StatusBadge = ({ status }: { status: Title["status"] }) => {
  const getStatusConfig = (status: Title["status"]) => {
    switch (status) {
      case "Онгоинг":
        return { text: "Онгоинг", color: "bg-green-500" };
      case "Завершен":
        return { text: "Завершено", color: "bg-blue-500" };
      case "Приостановлен":
        return { text: "Перерыв", color: "bg-yellow-500" };
      default:
        return { text: status, color: "bg-gray-500" };
    }
  };

  const { text, color } = getStatusConfig(status);

  return (
    <div
      className={`${color} text-white px-3 py-1 rounded-full text-sm font-medium`}
    >
      {text}
    </div>
  );
};

const InfoCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center gap-3 p-3 bg-[var(--card)] rounded-lg border border-[var(--border)]">
    <Icon className="w-5 h-5 text-[var(--muted-foreground)]" />
    <div>
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  </div>
);

const ChapterItem = ({
  chapter,
  onClick,
}: {
  chapter: any;
  titleId: number;
  onClick: (chapterId: number) => void;
}) => (
  <div
    className="flex items-center justify-between p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors group cursor-pointer"
    onClick={() => onClick(chapter.number)}
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-1">
        <span className="font-semibold text-[var(--foreground)]">
          Глава {chapter.number}
        </span>
        {chapter.title && (
          <span className="text-[var(--foreground)] truncate">
            {chapter.title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
        <span>{chapter.date}</span>
        <span>{chapter.views.toLocaleString()} просмотров</span>
      </div>
    </div>
    <Play className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
  </div>
);

const CommentItem = ({
  author,
  time,
  content,
  likes,
  avatarColor = "bg-[var(--primary)]",
}: {
  author: string;
  time: string;
  content: string;
  likes: number;
  avatarColor?: string;
}) => (
  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
    <div className="flex items-start gap-3">
      <div
        className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-[var(--primary-foreground)] font-semibold`}
      >
        {author.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-[var(--foreground)]">
            {author}
          </span>
          <span className="text-sm text-[var(--muted-foreground)]">{time}</span>
        </div>
        <p className="text-[var(--foreground)]">{content}</p>
        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
            <Heart className="w-4 h-4" />
            <span>{likes}</span>
          </button>
          <button className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
            Ответить
          </button>
        </div>
      </div>
    </div>
  </div>
);

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`pb-4 px-1 font-medium border-b-2 transition-colors ${
      active
        ? "border-[var(--primary)] text-[var(--primary)]"
        : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
    }`}
  >
    {children}
  </button>
);

// Основной компонент
export default function TitlePage() {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "chapters" | "comments">(
    "chapters"
  );
  const [chapterSearch, setChapterSearch] = useState("");
  const router = useRouter();

  // Фильтрация глав по поиску
  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return mockTitle.chapters;

    const searchLower = chapterSearch.toLowerCase();
    return mockTitle.chapters.filter(
      (chapter) =>
        chapter.number.toString().includes(chapterSearch) ||
        chapter.title?.toLowerCase().includes(searchLower)
    );
  }, [chapterSearch]);

  const handleStartReading = () => {
    router.push(
      `/read/${mockTitle.id}/chapter/${mockTitle.chapters[0].number}`
    );
  };

  const handleChapterClick = (chapterNumber: number) => {
    router.push(`/read/${mockTitle.id}/chapter/${chapterNumber}`);
  };

  // Боковая панель
  const Sidebar = () => (
    <div className="sticky top-20 space-y-6">
      {/* Постер и кнопки */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)]">
        <Image
          src={mockTitle.image}
          alt={mockTitle.title}
          className="w-full h-full object-cover"
          priority={true}
          width={280}
          height={400}
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={mockTitle.status} />
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2">
        <button
          onClick={handleStartReading}
          className="flex-1 bg-[var(--primary)] text-[var(--primary-foreground)] py-3 px-4 rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Начать чтение
        </button>
        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
        >
          <Bookmark
            className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
          />
        </button>
      </div>

      {/* Информационный блок */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center text-center p-3 bg-[var(--accent)] rounded-lg">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {mockTitle.totalChapters}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">глав</div>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-[var(--accent)] rounded-lg">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {(mockTitle.views / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              просмотров
            </div>
          </div>
        </div>
      </div>

      {/* Альтернативные названия */}
      {(mockTitle.alternativeTitles || mockTitle.originalTitle) && (
        <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
            Альтернативные названия
          </h3>
          <div className="space-y-2">
            {mockTitle.alternativeTitles?.map((title, index) => (
              <div key={index} className="text-sm text-[var(--foreground)]">
                {title}
              </div>
            ))}
            {mockTitle.originalTitle && !mockTitle.alternativeTitles && (
              <div className="text-sm text-[var(--foreground)]">
                {mockTitle.originalTitle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Источники */}
      {mockTitle.sources && mockTitle.sources.length > 0 && (
        <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
            Источники
          </h3>
          <div className="space-y-2">
            {mockTitle.sources.map((source, index) => (
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
              {mockTitle.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon={User} label="Автор" value={mockTitle.author} />
              <InfoCard icon={Tag} label="Художник" value={mockTitle.artist} />
            </div>
          </div>
        );

      case "chapters":
        return (
          <div className="space-y-4">
            {/* Поиск глав */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Поиск по номеру или названию главы..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
              />
            </div>

            {/* Список глав */}
            <div className="space-y-2">
              {filteredChapters.length > 0 ? (
                filteredChapters.map((chapter) => (
                  <ChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    titleId={mockTitle.id}
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

      {/* Заголовок страницы */}
      <div className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-[var(--accent)] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold truncate flex-1">
              {mockTitle.title}
            </h1>
          </div>
        </div>
      </div>

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
                  {mockTitle.title}
                </h1>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1 bg-[var(--card)] px-3 py-1 rounded-full border border-[var(--border)]">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{mockTitle.rating}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{mockTitle.year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{mockTitle.lastUpdate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      <span>{mockTitle.type}</span>
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
                  {mockTitle.genres.map((genre, index) => (
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
                    Главы ({mockTitle.chapters.length})
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
