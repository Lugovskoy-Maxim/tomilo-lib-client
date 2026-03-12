"use client";

import NavigationLink from "@/shared/navigation-link/NavigationLink";
import { usePathname } from "next/navigation";
import { Crown, Users } from "lucide-react";

interface NavigationProps {
  vertical?: boolean;
  onItemClick?: () => void;
  className?: string;
}

const navigationItems = [
  {
    name: "Персонажи",
    href: "/characters",
    icon: Users,
  },
  {
    name: "Лидеры",
    href: "/leaders",
    icon: Crown,
  },
] as const;

const ulClassName = (vertical: boolean) =>
  `
  flex
  ${vertical ? "flex-col space-y-4" : "flex-row gap-2 sm:gap-3"}
  ${vertical ? "items-stretch" : "items-center"}
`.trim();

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
      <ul className={ulClassName(vertical)}>
        {navigationItems.map((item) => (
          <li key={item.href} className={vertical ? "w-full" : ""}>
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
