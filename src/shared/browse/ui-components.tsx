import { Eye, ThumbsUp } from "lucide-react";
// Компонент кнопки таба
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 px-1 border-b-2 transition-colors ${
        active
          ? "border-[var(--primary)] text-[var(--primary)]"
          : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

// Компонент бейджа статуса
interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "онгоинг":
        return {
          bg: "bg-[var(--primary)]/20",
          text: "text-[var(--primary)]",
          border: "border-[var(--primary)]/30",
        };
      case "завершен":
        return {
          bg: "bg-[var(--primary)]/20",
          text: "text-[var(--primary)]",
          border: "border-[var(--primary)]/30",
        };
      case "анонс":
        return {
          bg: "bg-[var(--primary)]/20",
          text: "text-[var(--primary)]",
          border: "border-[var(--primary)]/30",
        };
      default:
        return {
          bg: "bg-[var(--muted)]/20",
          text: "text-[var(--muted-foreground)]",
          border: "border-[var(--muted)]/30",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}
    >
      {status}
    </span>
  );
}

// Компонент информационной карточки
interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function InfoCard({ icon: Icon, label, value }: InfoCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--accent)] rounded-lg">
      <div className="flex items-center justify-center w-8 h-8 bg-[var(--primary)]/10 rounded-lg">
        <Icon className="w-4 h-4 text-[var(--primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--muted-foreground)]">
          {label}
        </div>
        <div className="text-sm text-[var(--foreground)] truncate">{value}</div>
      </div>
    </div>
  );
}

// Компонент элемента главы
interface Chapter {
  _id: string;
  chapterNumber: number | string;
  name?: string;
  releaseDate?: string;
  views: number | string;
  pages?: string[];
  isPublished?: boolean;
  translator?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface ChapterItemProps {
  chapter: Chapter;
  onClick: (chapterNumber: number) => void;
}

function ChapterItem({ chapter, onClick }: ChapterItemProps) {
  const chapterNumber = typeof chapter.chapterNumber === 'string' ? parseFloat(chapter.chapterNumber) : chapter.chapterNumber;
  const views = typeof chapter.views === 'string' ? parseFloat(chapter.views) : chapter.views;

  return (
    <button
      onClick={() => onClick(chapterNumber)}
      className="w-full flex items-center justify-between p-3 cursor-pointer bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-start gap-4 ">
          <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
            Глава {chapterNumber}
          </span>
          {chapter.name && (
            <span className="text-sm text-[var(--muted-foreground)]">
              {chapter.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
        <span>{chapter.releaseDate || chapter.createdAt || 'Неизвестно'}</span>
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{(views / 1000).toFixed(1)}k</span>
        </div>
      </div>
    </button>
  );
}

// Компонент элемента комментария
interface CommentItemProps {
  author: string;
  time: string;
  content: string;
  likes: number;
  avatarColor?: string;
}

function CommentItem({
  author,
  time,
  content,
  likes,
  avatarColor = "bg-blue-500",
}: CommentItemProps) {
  return (
    <div className="flex gap-4 p-4 bg-[var(--card)] rounded-lg border border-[var(--border)]">
      <div
        className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium`}
      >
        {author.charAt(0)}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-[var(--foreground)]">{author}</span>
          <span className="text-sm text-[var(--muted-foreground)]">{time}</span>
        </div>

        <p className="text-[var(--foreground)] mb-3 leading-relaxed">
          {content}
        </p>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
            <ThumbsUp className="w-4 h-4" />
            <span>{likes}</span>
          </button>
          <button className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
            Ответить
          </button>
        </div>
      </div>
    </div>
  );
}

export { TabButton, StatusBadge, InfoCard, ChapterItem, CommentItem };
