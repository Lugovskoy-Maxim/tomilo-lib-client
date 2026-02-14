"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Bookmark, Clock, Package, Repeat, Settings } from "lucide-react";

export type ProfileNavTab = "about" | "bookmarks" | "history" | "inventory" | "exchanges";

const TABS: { id: ProfileNavTab; label: string; href: string; icon: React.ElementType }[] = [
  { id: "about", label: "О себе", href: "about", icon: User },
  { id: "bookmarks", label: "Закладки", href: "bookmarks", icon: Bookmark },
  { id: "history", label: "История", href: "history", icon: Clock },
  { id: "inventory", label: "Инвентарь", href: "inventory", icon: Package },
  { id: "exchanges", label: "Обмены", href: "social/exchanges", icon: Repeat },
];

interface ProfileNavProps {
  /** Базовый путь: "/profile" или "/user/username" */
  basePath: string;
  /** Показывать ссылку "Настройки" (только для своего профиля) */
  showSettings?: boolean;
}

export default function ProfileNav({ basePath, showSettings }: ProfileNavProps) {
  const pathname = usePathname();

  const isActive = (tab: (typeof TABS)[number]) => {
    const fullHref = `${basePath}/${tab.href}`;
    if (tab.id === "about") {
      return pathname === basePath || pathname === fullHref || pathname === `${basePath}/`;
    }
    return pathname === fullHref || pathname.startsWith(fullHref + "/");
  };

  return (
    <nav className="w-full border-b border-[var(--border)] mb-6" aria-label="Разделы профиля">
      <div className="flex flex-wrap items-center gap-1 sm:gap-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          const href = `${basePath}/${tab.href}`;

          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-medium transition-colors text-sm border-b-2 -mb-[2px] ${
                active
                  ? "text-[var(--primary)] border-[var(--primary)]"
                  : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
        {showSettings && (
          <Link
            href={`${basePath}/settings`}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-medium transition-colors text-sm border-b-2 -mb-[2px] ${
              pathname === `${basePath}/settings`
                ? "text-[var(--primary)] border-[var(--primary)]"
                : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)]"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="truncate">Настройки</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
