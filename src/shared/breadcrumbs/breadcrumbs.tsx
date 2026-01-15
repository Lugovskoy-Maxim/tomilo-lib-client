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
    
    // Специальные названия для определенных сегментов
    const segmentNames: Record<string, string> = {
      "titles": "Каталог",
      "browse": "Просмотр",
      "collections": "Коллекции",
      "chapter": "Глава",
      "top": "Топ",
      "bookmarks": "Закладки",
      "history": "История",
      "profile": "Профиль",
      "settings": "Настройки",
      "notifications": "Уведомления",
      "admin": "Админка"
    };
    
    const breadcrumbs: BreadcrumbItem[] = [
      {
        name: "Главная",
        href: "/",
        isCurrent: pathSegments.length === 0
      }
    ];
    
    let accumulatedPath = "";
    
    pathSegments.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Попытка извлечь номер главы из сегмента
      let displayName = segmentNames[segment] || segment;
      
      // Если это числовой сегмент и предыдущий был "chapter", то это номер главы
      if (index > 0 && pathSegments[index - 1] === "chapter" && !isNaN(Number(segment))) {
        displayName = `Глава ${segment}`;
      }
      
      // Для ID в URL оставляем как есть, но можно добавить логику для получения настоящих названий
      breadcrumbs.push({
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        href: isLast ? undefined : accumulatedPath,
        isCurrent: isLast
      });
    });
    
    return breadcrumbs;
  }, [pathname, items]);

  if (generatedItems.length <= 1) {
    return null; // Не показываем хлебные крошки на главной странице
  }

  return (
    <nav className={`my-2 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-gray-500">
        {generatedItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href && !item.isCurrent ? (
              <Link
                href={item.href}
                className="hover:text-[var(--primary)] transition-colors"
              >
                <span className={`max-w-[120px] sm:max-w-xs md:max-w-sm truncate ${item.isCurrent ? "text-[var(--foreground)] font-medium" : ""}`}>
                  {item.name}
                </span>
              </Link>
            ) : (
              <span className={`max-w-[120px] sm:max-w-xs md:max-w-sm truncate ${item.isCurrent ? "text-[var(--foreground)] font-medium" : ""}`}>
                {item.name}
              </span>
            )}
            
            {!item.isCurrent && index < generatedItems.length - 1 && (
              <ChevronRight className="mx-2 h-4 w-4" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}