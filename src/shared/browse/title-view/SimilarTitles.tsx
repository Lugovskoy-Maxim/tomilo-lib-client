"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shuffle, Star, ChevronDown, BookOpen } from "lucide-react";
import { useGetSimilarTitlesQuery, SimilarTitle as SimilarTitleType } from "@/store/api/titlesApi";
import { normalizeAssetUrl } from "@/lib/asset-url";
import { translateTitleType } from "@/lib/title-type-translations";

interface SimilarTitlesProps {
  titleId: string;
  genres?: string[];
  currentTitleSlug?: string;
  includeAdult?: boolean;
}

interface SimilarTitle extends SimilarTitleType {
  description?: string;
  ratingCount?: number;
}

function TitleCard({ title }: { title: SimilarTitle }) {
  const [imageError, setImageError] = useState(false);
  const titlePath = `/titles/${title.slug || title.id}`;

  return (
    <Link
      href={titlePath}
      className="group"
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-[var(--secondary)]/50">
        {title.cover && !imageError ? (
          <Image
            src={normalizeAssetUrl(title.cover)}
            alt={title.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-[var(--muted-foreground)]" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between text-xs text-white">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {title.rating?.toFixed(1) || "—"}
            </span>
            <span>{title.releaseYear}</span>
          </div>
        </div>

        {title.isAdult && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500/90 text-white text-[10px] font-bold rounded">
            18+
          </div>
        )}
      </div>

      <h4 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
        {title.title}
      </h4>
      <span className="text-xs text-[var(--muted-foreground)]">{translateTitleType(title.type)}</span>
    </Link>
  );
}

export function SimilarTitles({ titleId, genres, currentTitleSlug, includeAdult = false }: SimilarTitlesProps) {
  const { data, isLoading, error, refetch } = useGetSimilarTitlesQuery({ 
    id: titleId, 
    limit: 12, 
    includeAdult 
  });
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
        <div className="flex items-center gap-2 mb-4">
          <Shuffle className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Похожие тайтлы</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-xl bg-[var(--background)]/50 mb-2" />
              <div className="w-3/4 h-4 rounded bg-[var(--background)]/50 mb-1" />
              <div className="w-1/2 h-3 rounded bg-[var(--background)]/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data?.length) {
    return null;
  }

  const similarTitles = data.data || [];
  if (similarTitles.length === 0) return null;

  const hasMore = similarTitles.length > 4;
  const displayedTitles = showAll ? similarTitles : similarTitles.slice(0, 4);

  return (
    <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Похожие тайтлы</span>
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
          title="Обновить рекомендации"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayedTitles.map(title => (
          <TitleCard key={title.id} title={title} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center justify-center gap-1.5 w-full mt-4 py-2.5 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 border border-[var(--primary)]/20 hover:border-[var(--primary)]/30 rounded-xl transition-all"
        >
          <span>{showAll ? "Свернуть" : `Показать ещё ${similarTitles.length - 4}`}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
