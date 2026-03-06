"use client";

import Link from "next/link";
import { 
  Swords, 
  Heart, 
  Wand2, 
  Laugh, 
  Glasses,
  Crown,
  Sparkles,
  Zap
} from "lucide-react";

interface GenreItemProps {
  name: string;
  icon: React.ElementType;
  color: string;
  href: string;
}

const POPULAR_GENRES: GenreItemProps[] = [
  { name: "Боевик", icon: Swords, color: "text-red-500", href: "/titles?genres=Боевик" },
  { name: "Романтика", icon: Heart, color: "text-pink-500", href: "/titles?genres=Романтика" },
  { name: "Фэнтези", icon: Wand2, color: "text-purple-500", href: "/titles?genres=Фэнтези" },
  { name: "Комедия", icon: Laugh, color: "text-yellow-500", href: "/titles?genres=Комедия" },
  { name: "Повседневность", icon: Glasses, color: "text-blue-500", href: "/titles?genres=Повседневность" },
  { name: "Исекай", icon: Sparkles, color: "text-cyan-500", href: "/titles?genres=Исекай" },
  { name: "Гарем", icon: Crown, color: "text-amber-500", href: "/titles?genres=Гарем" },
  { name: "Все жанры", icon: Zap, color: "text-[var(--primary)]", href: "/titles" },
];

function GenreChip({ name, icon: Icon, color, href }: GenreItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 min-w-0 px-3 py-2 rounded-lg bg-[var(--card)]/60 backdrop-blur-sm border border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--border-hover)] transition-all duration-200 group"
    >
      <Icon size={16} className={`shrink-0 ${color} group-hover:scale-110 transition-transform`} strokeWidth={2} />
      <span className="text-sm font-medium text-[var(--foreground)] whitespace-nowrap min-w-0 overflow-hidden text-ellipsis">
        {name}
      </span>
    </Link>
  );
}

export function GenresQuickAccess() {
  return (
    <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-[var(--muted-foreground)]" />
        <h3 className="text-base sm:text-lg font-semibold text-[var(--muted-foreground)]">
          Популярные жанры
        </h3>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {POPULAR_GENRES.map((genre) => (
          <GenreChip key={genre.name} {...genre} />
        ))}
      </div>
    </section>
  );
}
