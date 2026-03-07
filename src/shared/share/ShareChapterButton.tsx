"use client";

import { useCallback } from "react";
import { Share } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface ShareChapterButtonProps {
  titleName: string;
  chapterNumber: number;
  chapterUrl: string;
  className?: string;
  ariaLabel?: string;
}

export function ShareChapterButton({
  titleName,
  chapterNumber,
  chapterUrl,
  className = "",
  ariaLabel = "Поделиться главой",
}: ShareChapterButtonProps) {
  const toast = useToast();

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const text = `${titleName}, глава ${chapterNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: titleName,
          text,
          url: chapterUrl,
        });
        toast.success("Ссылка отправлена");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(chapterUrl);
          toast.success("Ссылка скопирована");
        }
      }
    } else {
      await navigator.clipboard.writeText(chapterUrl);
      toast.success("Ссылка скопирована");
    }
  }, [titleName, chapterNumber, chapterUrl, toast]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className}
      aria-label={ariaLabel}
    >
      <Share className="w-4 h-4" />
    </button>
  );
}
