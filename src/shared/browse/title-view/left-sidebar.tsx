import { Share, Edit, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Title, Chapter } from "@/types/title";
import { ReadButton } from "@/shared/browse/read-button";
import { BookmarkButton } from "@/shared/bookmark-button";
import { useRouter } from "next/navigation";
import { checkAgeVerification } from "@/shared/modal/age-verification-modal";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { ReportModal } from "@/shared/report/report-modal";


interface LeftSidebarProps {
  titleData: Title;
  chapters: Chapter[];
  onShare: () => void;
  isAdmin: boolean;
  onAgeVerificationRequired: () => void;
}

export function LeftSidebar({
  titleData,
  chapters,
  onShare,
  isAdmin,
  onAgeVerificationRequired,
}: LeftSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdultContent = titleData.isAdult || (titleData.ageLimit && titleData.ageLimit >= 18);
  const isAgeVerified = checkAgeVerification(user);
  const shouldBlurImage = isAdultContent && !isAgeVerified;

  // Report state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (

    <div className="sticky top-2">
      <div className="flex relative w-full max-w-[280px] h-auto justify-center items-center mx-auto rounded-xl overflow-hidden shadow-2xl">
        {titleData?.coverImage ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_URL}${titleData.coverImage}`}
            alt={titleData?.name}
            width={280}
            height={420}
            unoptimized={true}
            className={`object-cover w-full h-auto rounded-xl ${shouldBlurImage ? 'blur-sm' : ''}`}
            priority
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 25vw, 280px"
            style={{ aspectRatio: '2/3' }}
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-auto" style={{ aspectRatio: '2/3' }} />
        )}
      </div>

      {/* Десктопные кнопки действий */}
      <div className="flex flex-col gap-2 mt-6">
        <ReadButton
          titleData={titleData}
          chapters={chapters}
          className="w-full"
          onAgeVerificationRequired={onAgeVerificationRequired}
        />
        <BookmarkButton titleId={titleData._id as string} initialBookmarked={false} />
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center justify-center gap-2 lg:p-1 p-4 rounded-full hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer"
          aria-label="Сообщить о проблеме"
        >
          <AlertTriangle className="w-4 h-4 text-[var(--foreground)]" />
          <span className="text-sm">Сообщить</span>
        </button>
        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 lg:p-1 p-4 rounded-full hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer"
          aria-label="Поделиться"
        >
          <Share className="w-4 h-4 text-[var(--foreground)]" />
          <span className="text-sm">Поделиться</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => router.push(`/admin/titles/edit/${titleData._id}`)}
            className="flex items-center justify-center gap-2 lg:p-1 p-4 rounded-full hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer"
            aria-label="Редактировать"
          >
            <Edit className="w-4 h-4 text-[var(--foreground)]" />
            <span className="text-sm">Редактировать</span>
          </button>
        )}
      </div>
      {/* Название тайтла в десктопной версии */}
      {/* <h1 className="text-2xl font-bold mt-4 text-center text-[var(--foreground)] px-2">
        {titleData?.name}
      </h1> */}

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
