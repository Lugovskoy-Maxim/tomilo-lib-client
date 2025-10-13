import { Play, Bookmark } from "lucide-react";

interface TitleActionsProps {
  onReadingClick: () => void;
  onBookmarkToggle: () => void;
  isBookmarked: boolean;
  buttonText: string;
  buttonSubText: string;
}

export default function TitleActions({
  onReadingClick,
  onBookmarkToggle,
  isBookmarked,
  buttonText,
  buttonSubText,
}: TitleActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onReadingClick}
        className="flex-1 bg-[var(--chart-1)] cursor-pointer text-[var(--primary)] py-3 px-4 rounded-lg font-medium hover:bg-[var(--chart-1)]/90 transition-colors flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5" />
        {buttonText}
      </button>
      <div className="text-xs text-[var(--muted-foreground)] text-center">
        {buttonSubText}
      </div>
      <button
        onClick={onBookmarkToggle}
        className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors flex items-center justify-center gap-2"
      >
        <Bookmark
          className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
        />
        {isBookmarked ? "В закладках" : "В закладки"}
      </button>
    </div>
  );
}