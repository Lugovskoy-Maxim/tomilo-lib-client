"use client";

import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGetReadingProgressQuery } from "@/store/api/titlesApi";
import { getTitlePath } from "@/lib/title-paths";
import { getTitleDisplayNameForSEO } from "@/lib/seo-title-name";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { getCoverUrls } from "@/lib/asset-url";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

const MAX_ITEMS = 5;

export default function ReadingProgressBlock() {
  const { data, isLoading } = useGetReadingProgressQuery(undefined, {
    skip: typeof window === "undefined",
  });

  const list = Array.isArray(data?.data) ? data.data : [];
  const displayList = list.slice(0, MAX_ITEMS);

  if (isLoading) {
    return (
      <div className="profile-glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--primary)]" />
          Прогресс чтения
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" aria-hidden />
        </div>
      </div>
    );
  }

  if (displayList.length === 0) return null;

  return (
    <div className="profile-glass-card rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[var(--primary)]" />
        Прогресс чтения
      </h3>
      <ul className="space-y-2">
        {displayList.map(item => {
          const titleName = item.title
            ? getTitleDisplayNameForSEO(
                item.title as unknown as Record<string, unknown>,
                (item.title.slug ?? "").trim(),
              )
            : `Тайтл #${item.titleId}`;
          const slug = item.title?.slug;
          const cover = item.title?.cover ?? item.title?.coverImage;
          const total = item.totalChapters ?? 0;
          const read = item.readChaptersCount ?? 0;
          const percent = total > 0 ? Math.round((read / total) * 100) : 0;
          const href = slug ? getTitlePath({ slug, id: item.titleId }) : `/titles/${item.titleId}`;

          return (
            <li key={item.titleId}>
              <Link
                href={href}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)]/50 transition-colors group"
              >
                <div className="w-10 h-14 rounded overflow-hidden shrink-0 bg-[var(--muted)]">
                  <OptimizedImage
                    src={cover ? getCoverUrls(cover).primary : IMAGE_HOLDER.src}
                    alt=""
                    width={40}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-[var(--primary)]">
                    {titleName}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {total > 0 ? `${read} / ${total} глав (${percent}%)` : "—"}
                  </p>
                  {total > 0 && (
                    <div className="mt-1 h-1 w-full rounded-full bg-[var(--muted)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full transition-all"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  )}
                </div>
                <ChevronRight
                  className="w-4 h-4 text-[var(--muted-foreground)] shrink-0"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
      {list.length > MAX_ITEMS && (
        <Link
          href="/history"
          className="mt-3 flex items-center justify-center gap-1 text-xs text-[var(--primary)] hover:underline py-2"
        >
          Всего {list.length} тайтлов
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
