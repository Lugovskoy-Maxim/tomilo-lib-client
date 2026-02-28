import { Share, Edit, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Title, Chapter } from "@/types/title";
import type { ReadingHistoryEntry } from "@/types/store";
import { ReadButton } from "@/shared/browse/ReadButton";
import { BookmarkButton } from "@/shared/bookmark-button/BookmarkButton";
import { useAuth } from "@/hooks/useAuth";
import { checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useState } from "react";
import { ReportModal } from "@/shared/report/ReportModal";
import { getCoverUrl } from "@/lib/asset-url";

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
        <div className="aspect-[2/3] w-full">
          {titleData?.coverImage ? (
            <Image
              src={getCoverUrl(titleData.coverImage)}
              alt={titleData?.name}
              width={300}
              height={450}
              unoptimized={true}
              className={`object-cover w-full h-full ${shouldBlurImage ? "blur-sm" : ""}`}
              priority
              sizes="(max-width: 640px) 90vw, 280px"
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
      <div className="flex flex-wrap justify-center gap-2 mt-4 min-w-0">
        <ReadButton
          titleData={titleData}
          chapters={chapters}
          readingHistory={readingHistory ?? undefined}
          className="flex-1 min-w-[120px] rounded-xl py-3 font-semibold shadow-md"
          onAgeVerificationRequired={onAgeVerificationRequired}
        />
        <div className="shrink-0">
          <BookmarkButton
            titleId={titleData._id as string}
            initialBookmarked={false}
            className="!p-0 w-12 h-12 min-w-[48px] rounded-xl flex items-center justify-center"
          />
        </div>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="shrink-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/80 text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          aria-label="Сообщить о проблеме"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>
        <button
          onClick={onShare}
          className="shrink-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/80 text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          aria-label="Поделиться"
        >
          <Share className="w-5 h-5" />
        </button>
        {isAdmin && (
          <Link
            href={`/admin/titles/edit/${titleData._id}`}
            className="shrink-0 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/80 hover:bg-[var(--secondary)] transition-colors"
            aria-label="Редактировать"
          >
            <Edit className="w-5 h-5 text-[var(--foreground)]" />
          </Link>
        )}
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
