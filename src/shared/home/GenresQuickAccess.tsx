"use client";

import Link from "next/link";
import { 
  Swords, 
  Heart, 
  Wand2, 
  Ghost, 
  Laugh, 
  Glasses,
  Crown,
  Sparkles,
  ChevronRight,
  Zap
} from "lucide-react";

interface GenreItemProps {
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
}

const POPULAR_GENRES: GenreItemProps[] = [
  { name: "Боевик", icon: Swords, color: "text-red-500", bgColor: "bg-red-500/10 hover:bg-red-500/20", href: "/titles?genres=Боевик" },
  { name: "Романтика", icon: Heart, color: "text-pink-500", bgColor: "bg-pink-500/10 hover:bg-pink-500/20", href: "/titles?genres=Романтика" },
  { name: "Фэнтези", icon: Wand2, color: "text-purple-500", bgColor: "bg-purple-500/10 hover:bg-purple-500/20", href: "/titles?genres=Фэнтези" },
  { name: "Ужасы", icon: Ghost, color: "text-slate-500", bgColor: "bg-slate-500/10 hover:bg-slate-500/20", href: "/titles?genres=Ужасы" },
  { name: "Комедия", icon: Laugh, color: "text-yellow-500", bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20", href: "/titles?genres=Комедия" },
  { name: "Повседневность", icon: Glasses, color: "text-blue-500", bgColor: "bg-blue-500/10 hover:bg-blue-500/20", href: "/titles?genres=Повседневность" },
  { name: "Исекай", icon: Sparkles, color: "text-cyan-500", bgColor: "bg-cyan-500/10 hover:bg-cyan-500/20", href: "/titles?genres=Исекай" },
  { name: "Гарем", icon: Crown, color: "text-amber-500", bgColor: "bg-amber-500/10 hover:bg-amber-500/20", href: "/titles?genres=Гарем" },
];

function GenreChip({ name, icon: Icon, color, bgColor, href }: GenreItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl ${bgColor} border border-transparent hover:border-current/20 transition-all duration-300 group`}
    >
      <Icon className={`w-4 h-4 ${color} group-hover:scale-110 transition-transform`} />
      <span className="text-sm font-medium text-[var(--foreground)] whitespace-nowrap">
        {name}
      </span>
    </Link>
  );
}

export function GenresQuickAccess() {
  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
              Популярные жанры
            </h3>
          </div>
          <Link
            href="/titles"
            className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline font-medium"
          >
            <span className="hidden sm:inline">Все жанры</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {POPULAR_GENRES.map(genre => (
            <GenreChip key={genre.name} {...genre} />
          ))}
        </div>
      </div>
    </section>
  );
}
