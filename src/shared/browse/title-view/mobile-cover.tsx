import { Share, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Title, Chapter } from "@/types/title";
import { ReadButton } from "@/shared/browse/read-button";
import { BookmarkButton } from "@/shared/bookmark-button";

interface MobileCoverProps {
  titleData: Title;
  chapters: Chapter[];
  onShare: () => void;
  isAdmin: boolean;
  onAgeVerificationRequired: () => void;
}

export default function MobileCover({
  titleData,
  chapters,
  onShare,
  isAdmin,
  onAgeVerificationRequired,
}: MobileCoverProps) {
  return (
    <div className="md:hidden mt-2 mb-6">
      <div className="flex relative w-max h-max justify-center items-center mx-auto rounded-xl overflow-hidden shadow-2xl">
        {titleData?.coverImage ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_URL}${titleData.coverImage}`}
            alt={titleData?.name}
            width={280}
            height={420}
            unoptimized={true}
            className="object-cover"
            priority
            sizes="(max-width: 280px) 100vw, 33vw"
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />
        )}
      </div>

      {/* Мобильные кнопки действий */}
      <div className="flex justify-center gap-2 mt-4 rounded-full">
        <ReadButton
          titleData={titleData}
          chapters={chapters}
          className="flex-1 text-sm"
          onAgeVerificationRequired={onAgeVerificationRequired}
        />
        <BookmarkButton titleId={titleData._id as string} initialBookmarked={false} />
        <button
          onClick={onShare}
          className="p-4 bg-[var(--secondary)] rounded-full hover:bg-[var(--secondary)]/80 transition-colors"
          aria-label="Поделиться"
        >
          <Share className="w-4 h-4 text-[var(--foreground)]" />
        </button>
        {isAdmin && (
          <Link
            href={`/admin/titles/${titleData._id}/edit`}
            className="p-3 bg-[var(--secondary)] rounded-full hover:bg-[var(--secondary)]/80 transition-colors"
            aria-label="Редактировать"
          >
            <Edit className="w-5 h-5 text-[var(--foreground)]" />
          </Link>
        )}
      </div>
      {/* Название тайтла в мобильной версии */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3 p-2 text-center break-words">
        {titleData?.name}
      </h1>
    </div>
  );
}
