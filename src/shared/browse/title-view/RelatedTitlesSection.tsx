"use client";

import { useState, useMemo, memo } from "react";
import Link from "next/link";
import { BookOpen, Star, Link2 } from "lucide-react";
import type { Title, RelatedTitleEntry, TitleBasic } from "@/types/title";
import { getCoverUrls } from "@/lib/asset-url";
import { translateTitleType } from "@/lib/title-type-translations";
import { getRelatedTitleLabel } from "@/lib/related-title-labels";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

function isPopulatedTitleId(
  titleId: string | TitleBasic,
): titleId is TitleBasic {
  return typeof titleId === "object" && titleId !== null && "name" in titleId;
}

interface RelatedTitlesSectionProps {
  titleData: Title;
  includeAdult?: boolean;
}

const RelatedTitleCard = memo(function RelatedTitleCard({ title }: { title: TitleBasic }) {
  const [imageError, setImageError] = useState(false);
  const slug = title.slug ?? title._id;
  const titlePath = `/titles/${slug}`;
  const { primary: imageSrc, fallback: imageFallback } = useMemo(
    () => getCoverUrls(title.coverImage ?? "", ""),
    [title.coverImage],
  );
  const showImage = title.coverImage && !imageError;
  const isAdult = (title.ageLimit ?? 0) >= 18;

  return (
    <Link href={titlePath} className="group">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-[var(--muted)]/30">
        {showImage ? (
          <OptimizedImage
            src={imageSrc}
            fallbackSrc={imageFallback}
            alt={title.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover transition-opacity duration-200 group-hover:scale-[1.03] transition-transform"
            hidePlaceholder
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-[var(--muted-foreground)]" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between text-xs text-white">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {title.averageRating?.toFixed(1) ?? "—"}
            </span>
            {title.releaseYear != null && <span>{title.releaseYear}</span>}
          </div>
        </div>

        {isAdult && (
          <div className="absolute top-1.5 right-1.5 z-10">
            <div className="bg-red-500/30 backdrop-blur-sm text-red-600 border-red-500 px-2 py-0.5 rounded-md text-[10px] font-medium shadow-lg border">
              18+
            </div>
          </div>
        )}
      </div>

      <h4 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
        {title.name}
      </h4>
      <span className="text-xs text-[var(--muted-foreground)]">
        {translateTitleType(title.type ?? "")}
      </span>
    </Link>
  );
});

export function RelatedTitlesSection({
  titleData,
  includeAdult = true,
}: RelatedTitlesSectionProps) {
  const entriesWithPopulatedTitle = useMemo(() => {
    const related = titleData?.relatedTitles ?? [];
    return related.filter(
      (entry): entry is RelatedTitleEntry & { titleId: TitleBasic } =>
        isPopulatedTitleId(entry.titleId) &&
        (includeAdult || (entry.titleId.ageLimit ?? 0) < 18),
    );
  }, [titleData?.relatedTitles, includeAdult]);

  const byRelation = useMemo(() => {
    const map = new Map<string, TitleBasic[]>();
    for (const entry of entriesWithPopulatedTitle) {
      const label = getRelatedTitleLabel(entry.relationType);
      const list = map.get(label) ?? [];
      list.push(entry.titleId);
      map.set(label, list);
    }
    return map;
  }, [entriesWithPopulatedTitle]);

  if (entriesWithPopulatedTitle.length === 0) return null;

  return (
    <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-[var(--primary)]" />
        <span className="font-medium text-[var(--foreground)]">
          Связанные тайтлы
        </span>
      </div>

      <div className="space-y-5">
        {Array.from(byRelation.entries()).map(([relationLabel, titles]) => (
          <div key={relationLabel}>
            <h4 className="text-xs uppercase tracking-wider font-medium text-[var(--muted-foreground)] mb-2">
              {relationLabel}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {titles.map((title) => (
                <RelatedTitleCard key={title._id} title={title} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
