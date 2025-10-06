"use client";
import { Star } from "lucide-react";

interface CardProps {
  id: number;
  title: string;
  type: string;
  year: number;
  rating: number;
  image?: string;
  genres: string[];
}

interface CarouselCardProps {
  data: CardProps;
  onCardClick?: (id: number) => void;
}

export default function CarouselCard({ data, onCardClick }: CarouselCardProps) {
  const handleClick = () => {
    onCardClick?.(data.id);
  };

  return (
    <div
      className="overflow-hidden rounded-lg group cursor-pointer active:cursor-grabbing transition-all w-30 sm:w-30 md:w-35 lg:w-40 select-none"
      onClick={handleClick}
    >
      <div className="relative">
        {data.image && (
          <div
            className="w-full h-40 sm:h-48 md:h-52 lg:h-55 rounded-lg bg-cover bg-center transition-transform group-hover:scale-105"
            style={{ backgroundImage: `url(${data.image})` }}
          />
        )}
        <div className="absolute top-1 left-1 bg-black/80 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] sm:text-xs font-semibold">
          <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-white" />
          {data.rating}
        </div>
      </div>

      <div className="p-1 sm:p-1.5">
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-[var(--muted-foreground)] mb-1">
          <span className="bg-[var(--secondary)] px-1 py-0.5 rounded text-[9px] sm:text-[10px]">
            {data.type}
          </span>
          <span className="text-[9px] sm:text-[10px]">{data.year}</span>
        </div>

        <h3 className="font-semibold text-[11px] sm:text-xs text-[var(--foreground)] line-clamp-2 leading-tight mb-1">
          {data.title}
        </h3>

        <div className="hidden xs:flex flex-wrap gap-0.5 mt-1">
          {data.genres.slice(0, 1).map((genre, index) => (
            <span
              key={index}
              className="text-[9px] sm:text-[10px] bg-[var(--accent)] text-[var(--accent-foreground)] px-1 py-0.5 rounded"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
