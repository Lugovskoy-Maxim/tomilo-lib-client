"use client";

import NavigationLink from "@/shared/navigation-link/navigation-link";
import { usePathname } from "next/navigation";
import { BookOpen, Trophy } from "lucide-react";

interface NavigationProps {
  vertical?: boolean;
  onItemClick?: () => void;
  className?: string;
}

const navigationItems = [
  {
    name: "Каталог",
    href: "/browse",
    icon: BookOpen,
  },
  {
    name: "Топ",
    href: "/top",
    icon: Trophy,
  },
];

export default function Navigation({
  vertical = false,
  onItemClick,
  className = "",
}: NavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleItemClick = () => {
    onItemClick?.();
  };

  return (
    <nav className={className}>
      <ul
        className={`
          flex
          ${vertical 
            ? "flex-col space-y-4" 
            : "flex-row space-x-6 lg:space-x-8"
          }
          ${vertical ? "items-stretch" : "items-center"}
        `}
      >
        {navigationItems.map((item, index) => (
          <li key={index} className={vertical ? "w-full" : ""}>
            <NavigationLink
              href={item.href}
              isActive={isActive(item.href)}
              title={item.name}
              onClick={handleItemClick}
              vertical={vertical}
              icon={item.icon}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}