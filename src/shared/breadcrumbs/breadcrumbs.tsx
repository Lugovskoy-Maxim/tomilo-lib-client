"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useMemo } from "react";
import { MESSAGES } from "@/constants/messages";

interface BreadcrumbItem {
  name: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Соответствие сегментов URL ключам в MESSAGES.BREADCRUMBS
const SEGMENT_TO_KEY: Record<string, keyof typeof MESSAGES.BREADCRUMBS> = {
  about: "ABOUT",
  contact: "CONTACT",
  "terms-of-use": "TERMS_OF_USE",
  copyright: "COPYRIGHT",
  updates: "UPDATES",
  titles: "TITLES",
  browse: "BROWSE",
  collections: "COLLECTIONS",
  chapter: "CHAPTER",
  chapters: "CHAPTERS",
  top: "TOP",
  bookmarks: "BOOKMARKS",
  history: "HISTORY",
  profile: "PROFILE",
  settings: "SETTINGS",
  notifications: "NOTIFICATIONS",
  admin: "ADMIN",
  edit: "EDIT",
  new: "NEW_TITLE",
  users: "USERS",
  user: "USER",
  "reset-password": "RESET_PASSWORD",
  "verify-email": "VERIFY_EMAIL",
  "rate-limit": "RATE_LIMIT",
  "tomilo-shop": "TOMILO_SHOP",
};

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  const generatedItems = useMemo(() => {
    if (items) return items;

    const pathSegments = pathname.split("/").filter(Boolean);
    const isAdminPath = pathSegments[0] === "admin";
    const BC = MESSAGES.BREADCRUMBS;

    const breadcrumbs: BreadcrumbItem[] = [
      {
        name: BC.HOME,
        href: "/",
        isCurrent: pathSegments.length === 0,
      },
    ];

    let accumulatedPath = "";

    pathSegments.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      let displayName: string;

      const key = SEGMENT_TO_KEY[segment];
      if (key) {
        displayName = BC[key];
      } else {
        displayName = segment;
      }

      // В админке: каталог — «Тайтлы», не «Каталог»
      if (isAdminPath && segment === "titles") {
        displayName = BC.TITLES_ADMIN;
      }
      // В админке: после "chapters" сегмент может быть "new" или id главы
      if (isAdminPath && index > 0 && pathSegments[index - 1] === "chapters") {
        if (segment === "new") displayName = BC.NEW_CHAPTER;
        else if (segment !== "chapters" && !key) displayName = BC.CHAPTER;
      }
      // ID (Mongo ObjectId или число) — короткая подпись в админке
      if (isAdminPath && (/^[a-f0-9]{24}$/i.test(segment) || /^\d+$/.test(segment))) {
        const prev = pathSegments[index - 1];
        if (prev === "edit" && pathSegments[index - 2] === "titles") displayName = BC.TITLE;
        else if (prev === "chapters") displayName = BC.CHAPTER;
        else if (pathSegments[index - 1] === "users") displayName = BC.PROFILE;
      }

      // Для неизвестных сегментов — первая буква заглавная (slug тайтла и т.д.)
      if (displayName === segment && segment.length > 0) {
        displayName = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      breadcrumbs.push({
        name: displayName,
        href: isLast ? undefined : accumulatedPath,
        isCurrent: isLast,
      });
    });

    return breadcrumbs;
  }, [pathname, items]);

  if (generatedItems.length <= 1) {
    return null;
  }

  return (
    <nav
      className={`breadcrumbs-nav ${className}`}
      aria-label="Хлебные крошки"
    >
      <ol className="breadcrumbs-list">
        {generatedItems.map((item, index) => (
          <li key={index} className="breadcrumbs-item">
            {item.href && !item.isCurrent ? (
              <Link href={item.href} className="breadcrumbs-link">
                {index === 0 ? (
                  <span className="breadcrumbs-link-inner">
                    <Home className="breadcrumbs-home-icon" aria-hidden />
                    <span className="sr-only">{item.name}</span>
                  </span>
                ) : (
                  <span className="breadcrumbs-link-inner breadcrumbs-text truncate">
                    {item.name}
                  </span>
                )}
              </Link>
            ) : (
              <span
                className={`breadcrumbs-text truncate ${item.isCurrent ? "breadcrumbs-current" : ""}`}
                aria-current={item.isCurrent ? "page" : undefined}
              >
                {index === 0 && !item.href ? (
                  <>
                    <Home className="breadcrumbs-home-icon" aria-hidden />
                    <span className="sr-only">{item.name}</span>
                  </>
                ) : index === 0 ? null : (
                  item.name
                )}
              </span>
            )}

            {!item.isCurrent && index < generatedItems.length - 1 && (
              <ChevronRight className="breadcrumbs-separator" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
