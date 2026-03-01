"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shuffle, Star, ChevronRight, BookOpen } from "lucide-react";
import { useGetRecommendedTitlesQuery } from "@/store/api/titlesApi";
import { normalizeAssetUrl } from "@/lib/asset-url";
import { Title } from "@/types/title";

interface SimilarTitlesProps {
  titleId: string;
  genres?: string[];
  currentTitleSlug?: string;
}

interface SimilarTitle {
  id: string;
  title: string;
  cover: string;
  rating: number;
  type: string;
  releaseYear: number;
  description: string;
  isAdult: boolean;
  ratingCount?: number;
}

function TitleCard({ title, slug }: { title: SimilarTitle; slug?: string }) {
  const [imageError, setImageError] = useState(false);
  const titlePath = `/titles/${slug || title.id}`;

  return (
    <Link
      href={titlePath}
      className="group flex-shrink-0 w-[140px] sm:w-[160px]"
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-[var(--secondary)]/50">
        {title.cover && !imageError ? (
          <Image
            src={normalizeAssetUrl(title.cover)}
            alt={title.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
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
      <span className="text-xs text-[var(--muted-foreground)]">{title.type}</span>
    </Link>
  );
}

export function SimilarTitles({ titleId, genres, currentTitleSlug }: SimilarTitlesProps) {
  const { data, isLoading, error, refetch } = useGetRecommendedTitlesQuery({ limit: 12, includeAdult: false });
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
        <div className="flex items-center gap-2 mb-4">
          <Shuffle className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Похожие тайтлы</span>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex-shrink-0 w-[140px]">
              <div className="aspect-[3/4] rounded-xl bg-[var(--background)]/50 mb-2" />
              <div className="w-24 h-4 rounded bg-[var(--background)]/50 mb-1" />
              <div className="w-16 h-3 rounded bg-[var(--background)]/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data?.length) {
    return null;
  }

  const filteredTitles = data.data.filter(t => t.id !== titleId);
  if (filteredTitles.length === 0) return null;

  const displayedTitles = showAll ? filteredTitles : filteredTitles.slice(0, 6);

  return (
    <div className="bg-[var(--secondary)]/70 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)]/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium text-[var(--foreground)]">Похожие тайтлы</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
            title="Обновить рекомендации"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          {filteredTitles.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
            >
              {showAll ? "Свернуть" : "Все"}
              <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>
      </div>

      <div className={`flex gap-4 ${showAll ? "flex-wrap" : "overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--primary)]/20 scrollbar-track-transparent"}`}>
        {displayedTitles.map(title => (
          <TitleCard key={title.id} title={title} />
        ))}
      </div>
    </div>
  );
}
