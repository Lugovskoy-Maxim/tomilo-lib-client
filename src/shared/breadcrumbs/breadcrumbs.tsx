"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

interface BreadcrumbItem {
  name: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Генерация хлебных крошек на основе текущего пути, если не переданы явно
  const generatedItems = useMemo(() => {
    if (items) return items;

    const pathSegments = pathname.split("/").filter(Boolean);
    const isAdminPath = pathSegments[0] === "admin";

    // Специальные названия для определенных сегментов
    const segmentNames: Record<string, string> = {
      titles: isAdminPath ? "Тайтлы" : "Каталог",
      browse: "Просмотр",
      collections: "Коллекции",
      chapter: "Глава",
      top: "Топ",
      bookmarks: "Закладки",
      history: "История",
      profile: "Профиль",
      settings: "Настройки",
      notifications: "Уведомления",
      admin: "Админка",
      edit: "Редактирование",
      new: "Новый тайтл",
      chapters: "Главы",
      users: "Пользователи",
    };

    const breadcrumbs: BreadcrumbItem[] = [
      {
        name: "Главная",
        href: "/",
        isCurrent: pathSegments.length === 0,
      },
    ];

    let accumulatedPath = "";

    pathSegments.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      let displayName = segmentNames[segment] || segment;

      // В админке: после "chapters" сегмент может быть "new" или id главы
      if (isAdminPath && index > 0 && pathSegments[index - 1] === "chapters") {
        if (segment === "new") displayName = "Новая глава";
        else if (segment !== "chapters" && !segmentNames[segment]) displayName = "Глава";
      }
      // ID (Mongo ObjectId или число) — короткая подпись в админке
      if (isAdminPath && (/^[a-f0-9]{24}$/i.test(segment) || /^\d+$/.test(segment))) {
        const prev = pathSegments[index - 1];
        if (prev === "edit" && pathSegments[index - 2] === "titles") displayName = "Тайтл";
        else if (prev === "chapters") displayName = "Глава";
        else if (pathSegments[index - 1] === "users") displayName = "Профиль";
      }

      breadcrumbs.push({
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        href: isLast ? undefined : accumulatedPath,
        isCurrent: isLast,
      });
    });

    return breadcrumbs;
  }, [pathname, items]);

  if (generatedItems.length <= 1) {
    return null; // Не показываем хлебные крошки на главной странице
  }

  return (
    <nav className={`my-2 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-x-2 text-sm text-[var(--muted-foreground)]">
        {generatedItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href && !item.isCurrent ? (
              <Link href={item.href} className="hover:text-[var(--primary)] transition-colors">
                <span
                  className={`max-w-[120px] sm:max-w-xs md:max-w-sm truncate ${item.isCurrent ? "text-[var(--foreground)] font-medium" : ""}`}
                >
                  {item.name}
                </span>
              </Link>
            ) : (
              <span
                className={`max-w-[120px] sm:max-w-xs md:max-w-sm truncate ${item.isCurrent ? "text-[var(--foreground)] font-medium" : ""}`}
              >
                {item.name}
              </span>
            )}

            {!item.isCurrent && index < generatedItems.length - 1 && (
              <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
