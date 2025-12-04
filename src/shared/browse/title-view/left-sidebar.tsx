import { Share, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Title, Chapter } from "@/types/title";
import { ReadButton } from "@/shared/browse/read-button";
import { BookmarkButton } from "@/shared/bookmark-button";
import { useRouter } from "next/navigation";


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
  return (
    <div className="sticky top-4">
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
          onClick={onShare}
          className="flex items-center justify-center gap-2 lg:p-1 p-4 rounded-full hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer"
          aria-label="Поделиться"
        >
          <Share className="w-4 h-4 text-[var(--foreground)]" />
          <span className="text-sm">Поделиться</span>
        </button>
          <button
            onClick={() => router.push(`/admin/titles/${titleData._id}/edit`)}
            className={`${isAdmin ? "" : "hidden"} flex items-center justify-center gap-2 lg:p-1 p-4  rounded-full hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer`}
            aria-label="Редактировать"
            disabled={isAdmin ? false : true}
          >
            <Edit className="w-4 h-4 text-[var(--foreground)]" />
            <span className="text-sm">Редактировать</span>
          </button>
      </div>
      {/* Название тайтла в десктопной версии */}
      {/* <h1 className="text-2xl font-bold mt-4 text-center text-[var(--foreground)] px-2">
        {titleData?.name}
      </h1> */}
    </div>
  );
}
