import { Share, Edit, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Title, Chapter } from "@/types/title";
import type { ReadingHistoryEntry } from "@/types/store";
import { ReadButton } from "@/shared/browse/ReadButton";
import { BookmarkButton } from "@/shared/bookmark-button/BookmarkButton";
import { useAuth } from "@/hooks/useAuth";
import { checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useState } from "react";
import { ReportModal } from "@/shared/report/ReportModal";
import { getCoverUrls } from "@/lib/asset-url";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

interface MobileCoverProps {
  titleData: Title;
  chapters: Chapter[];
  readingHistory?: ReadingHistoryEntry | null;
  onShare: () => void;
  isAdmin: boolean;
  onAgeVerificationRequired: () => void;
  onTabChange?: (tab: "main" | "chapters" | "comments") => void;
}

export default function MobileCover({
  titleData,
  chapters,
  readingHistory,
  onShare,
  isAdmin,
  onAgeVerificationRequired,
}: MobileCoverProps) {
  const { user } = useAuth();
  const isAdultContent = titleData.isAdult || (titleData.ageLimit && titleData.ageLimit >= 18);
  const isAgeVerified = checkAgeVerification(user);
  const shouldBlurImage = isAdultContent && !isAgeVerified;

  // Report state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="lg:hidden mt-2 mb-6">
      {/* Обложка */}
      <div className="relative w-full max-w-[260px] sm:max-w-[280px] mx-auto overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg ring-1 ring-[var(--border)]/50">
        <div className="relative aspect-[2/3] w-full">
          {titleData?.coverImage ? (
            <OptimizedImage
              src={getCoverUrls(titleData.coverImage).primary}
              fallbackSrc={getCoverUrls(titleData.coverImage).fallback}
              alt={titleData?.name}
              fill
              className={`object-cover ${shouldBlurImage ? "blur-sm" : ""}`}
              priority
            />
          ) : (
            <div className="w-full h-full bg-[var(--secondary)] border-2 border-dashed border-[var(--border)]" />
          )}
        </div>
      </div>

      {/* Название тайтла */}
      <h1 className="text-center mt-4 text-xl sm:text-2xl font-bold text-[var(--foreground)] px-2 leading-tight">
        {titleData.name}
      </h1>

      {isAdmin && (
        <p className="text-center mt-2 text-xs text-[var(--muted-foreground)]">ID: {titleData._id}</p>
      )}

      {/* Кнопки действий */}
      <div className="flex flex-col gap-3 mt-4 px-2">
        {/* Основные действия */}
        <div className="flex gap-2">
          <ReadButton
            titleData={titleData}
            chapters={chapters}
            readingHistory={readingHistory ?? undefined}
            className="flex-1 rounded-xl py-3 font-semibold shadow-md"
            onAgeVerificationRequired={onAgeVerificationRequired}
          />
          <BookmarkButton
            titleId={titleData._id as string}
            initialBookmarked={false}
            className="!p-0 w-12 h-12 min-w-[48px] rounded-xl flex items-center justify-center shrink-0"
          />
        </div>
        
        {/* Вторичные действия */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex-1 h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--primary)]/30 transition-colors flex items-center justify-center gap-2"
            aria-label="Сообщить о проблеме"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Сообщить</span>
          </button>
          <button
            onClick={onShare}
            className="flex-1 h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--primary)]/30 transition-colors flex items-center justify-center gap-2"
            aria-label="Поделиться"
          >
            <Share className="w-4 h-4" />
            <span className="text-sm">Поделиться</span>
          </button>
          {isAdmin && (
            <Link
              href={`/admin/titles/edit/${titleData._id}`}
              className="flex-1 h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--primary)]/30 transition-colors flex items-center justify-center gap-2"
              aria-label="Редактировать"
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm">Изменить</span>
            </Link>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        entityType="title"
        entityId={titleData._id as string}
        entityTitle={titleData.name}
      />
    </div>
  );
}
