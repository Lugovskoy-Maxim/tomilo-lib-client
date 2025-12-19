"use client";


import { Title } from "@/types/title";
import Image from "next/image";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { getTitlePath } from "@/lib/title-paths";

interface BookmarkCardProps {
  title: Title;
  onRemove?: (titleId: string) => void;
  isLoading?: boolean;
}

export default function BookmarkCard({ title, onRemove, isLoading }: BookmarkCardProps) {
  const router = useRouter();
  const { removeBookmark } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const toast = useToast();


  const handleClick = () => {
    router.push(getTitlePath(title));
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    
    try {
      const result = await removeBookmark(title._id);
      if (result.success) {
        onRemove?.(title._id);
      } else {
        console.error("Ошибка при удалении закладки:", result.error);
        toast.error(`Ошибка при удалении закладки: ${result.error}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении закладки:", error);
      toast.error("Произошла ошибка при удалении закладки");
    } finally {
      setIsRemoving(false);
    }
  };

  // Формируем корректный URL для изображения
  const getImageUrl = (coverImage: string | undefined) => {
    if (!coverImage) return IMAGE_HOLDER.src;
    
    // Если изображение уже полный URL, используем как есть
    if (coverImage.startsWith('http')) {
      return coverImage;
    }
    
    // Если относительный путь, добавляем базовый URL
    return `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${coverImage}`;
  };

  // Проверяем, нужно ли показывать изображение
  const showImage = title.coverImage && !imageError;

  return (
    <div
      className="bg-[var(--background)] rounded-lg p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors group cursor-pointer relative"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="w-12 h-16 bg-gradient-to-br from-[var(--chart-1)]/20 to-[var(--primary)]/20 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
          {showImage ? (
            <Image
              src={getImageUrl(title.coverImage)}
              alt={title.name}
              width={48}
              height={64}
              className="w-full h-full object-cover"
              unoptimized
              onError={() => {
                // Если изображение не загружается, показываем заглушку
                setImageError(true);
              }}
            />
          ) : (
            <svg
              className="w-6 h-6 text-[var(--chart-1)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--muted-foreground)] text-sm mb-1 truncate">
            {title.name}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-1">
            {title.genres?.slice(0, 2).join(", ") || "Жанры не указаны"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">
              {title.status === "completed" ? "Завершено" : "Продолжается"}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {title.totalChapters} гл.
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleRemove}
        disabled={isRemoving || isLoading}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded-full transition-all disabled:opacity-50"
      >
        {isRemoving || isLoading ? (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <X className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}