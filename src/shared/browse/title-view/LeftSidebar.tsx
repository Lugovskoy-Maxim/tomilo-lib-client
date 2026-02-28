import { Share, Edit, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { Title, Chapter } from "@/types/title";
import type { ReadingHistoryEntry } from "@/types/store";
import { ReadButton } from "@/shared/browse/ReadButton";
import { BookmarkButton } from "@/shared/bookmark-button/BookmarkButton";
import { useRouter } from "next/navigation";
import { checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useAuth } from "@/hooks/useAuth";
import { getCoverUrl } from "@/lib/asset-url";

interface LeftSidebarProps {
  titleData: Title;
  chapters: Chapter[];
  readingHistory?: ReadingHistoryEntry | null;
  onShare: () => void;
  isAdmin: boolean;
  onAgeVerificationRequired: () => void;
  onReportClick?: (data: {
    entityType: "title" | "chapter";
    entityId: string;
    entityTitle: string;
    titleId?: string;
    creatorId?: string;
  }) => void;
}

export function LeftSidebar({
  titleData,
  chapters,
  readingHistory,
  onShare,
  isAdmin,
  onAgeVerificationRequired,
  onReportClick,
}: LeftSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdultContent = titleData.isAdult || (titleData.ageLimit && titleData.ageLimit >= 18);
  const isAgeVerified = checkAgeVerification(user);
  const shouldBlurImage = isAdultContent && !isAgeVerified;

  const actionButtonClass =
    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 border border-[var(--border)] bg-[var(--card)]/80 text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--chart-1)]/30 hover:shadow-md";

  return (
    <div className="space-y-5">
      {/* Обложка с тенью и рамкой */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg ring-1 ring-[var(--border)]/50">
        <div className="aspect-[2/3] w-full">
          {titleData?.coverImage ? (
            <Image
              src={getCoverUrl(titleData.coverImage)}
              alt={titleData?.name}
              width={280}
              height={420}
              unoptimized={true}
              className={`object-cover w-full h-full ${shouldBlurImage ? "blur-sm" : ""}`}
              priority
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 25vw, 280px"
            />
          ) : (
            <div className="w-full h-full bg-[var(--secondary)] border-2 border-dashed border-[var(--border)]" />
          )}
        </div>
      </div>

      {isAdmin && (
        <p className="text-center text-xs text-[var(--muted-foreground)]">ID: {titleData._id}</p>
      )}

      {/* Кнопки действий */}
      <div className="flex flex-col gap-2">
        <ReadButton
          titleData={titleData}
          chapters={chapters}
          readingHistory={readingHistory ?? undefined}
          className="w-full rounded-xl py-3.5 font-semibold shadow-md hover:shadow-lg transition-shadow"
          onAgeVerificationRequired={onAgeVerificationRequired}
        />
        <BookmarkButton
          titleId={titleData._id as string}
          initialBookmarked={false}
          className="w-full py-3 px-4 text-sm font-medium"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (onReportClick) {
                onReportClick({
                  entityType: "title",
                  entityId: titleData._id as string,
                  entityTitle: titleData.name,
                  titleId: titleData._id as string,
                  creatorId: titleData.creatorId,
                });
              } else {
                window.dispatchEvent(
                  new CustomEvent("openReportModal", {
                    detail: {
                      entityType: "title",
                      entityId: titleData._id as string,
                      entityTitle: titleData.name,
                      titleId: titleData._id as string,
                      creatorId: titleData.creatorId,
                    },
                  })
                );
              }
            }}
            className={actionButtonClass}
            aria-label="Сообщить о проблеме"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Сообщить</span>
          </button>
          <button onClick={onShare} className={actionButtonClass} aria-label="Поделиться">
            <Share className="w-4 h-4 shrink-0" />
            <span>Поделиться</span>
          </button>
        </div>
        {isAdmin && (
          <button
            onClick={() => router.push(`/admin/titles/edit/${titleData._id}`)}
            className={actionButtonClass}
            aria-label="Редактировать"
          >
            <Edit className="w-4 h-4 shrink-0" />
            <span>Редактировать</span>
          </button>
        )}
      </div>
    </div>
  );
}
