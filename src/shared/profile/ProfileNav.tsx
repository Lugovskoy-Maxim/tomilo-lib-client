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
    <nav
      className="w-full mb-4 sm:mb-6 overflow-x-auto overflow-y-hidden -mx-1 px-1"
      aria-label="Разделы профиля"
    >
      <div className="flex flex-nowrap min-w-0 gap-1 sm:gap-2 w-max sm:w-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          const href = `${basePath}/${tab.href}`;

          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex items-center gap-1.5 sm:gap-2 shrink-0 px-3 min-[360px]:px-4 sm:px-4 py-2.5 sm:py-2.5 rounded-xl font-medium transition-colors text-xs min-[360px]:text-sm ${
                active
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] bg-[var(--secondary)]/50 hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate whitespace-nowrap">{tab.label}</span>
            </Link>
          );
        })}
        {showSettings && (
          <Link
            href={`${basePath}/settings`}
            className={`flex items-center gap-1.5 sm:gap-2 shrink-0 px-3 min-[360px]:px-4 sm:px-4 py-2.5 sm:py-2.5 rounded-xl font-medium transition-colors text-xs min-[360px]:text-sm ${
              pathname === `${basePath}/settings`
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] bg-[var(--secondary)]/50 hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate whitespace-nowrap">Настройки</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
