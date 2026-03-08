"use client";

// import { useState, useEffect } from "react";
// import {
//   BookOpen,
//   Sparkles,
//   Library,
//   BookMarked,
//   Bookmark,
//   BookOpenCheck,
//   LibrarySquare,
//   type LucideIcon,
// } from "lucide-react";

// const ICONS: LucideIcon[] = [
//   BookOpen,
//   Sparkles,
//   Library,
//   BookMarked,
//   Bookmark,
//   BookOpenCheck,
//   LibrarySquare,
// ];

// const COUNT = 12;
// const MIN_SIZE = 24;
// const MAX_SIZE = 56;

// interface IconItem {
//   Icon: LucideIcon;
//   x: number;
//   y: number;
//   size: number;
//   duration: number;
//   delay: number;
// }

// /** Фиксированный начальный набор для совпадения сервер/клиент при гидрации */
// function getInitialItems(): IconItem[] {
//   return Array.from({ length: COUNT }, (_, i) => ({
//     Icon: ICONS[i % ICONS.length],
//     x: (15 + (i * 7)) % 85,
//     y: (20 + (i * 6)) % 80,
//     size: MIN_SIZE + (i % 4) * 8,
//     duration: 18 + (i % 5),
//     delay: i * 0.5,
//   }));
// }

// /** Рандомные позиции и иконки (только на клиенте) */
// function getRandomItems(): IconItem[] {
//   return Array.from({ length: COUNT }, () => ({
//     Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
//     x: Math.random() * 88,
//     y: Math.random() * 85,
//     size: MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
//     duration: 14 + Math.random() * 12,
//     delay: Math.random() * 4,
//   }));
// }

/**
 * Декоративный фон (пока пусто).
 */
export default function LinesBackground() {
  // const [items, setItems] = useState<IconItem[]>(getInitialItems);

  // useEffect(() => {
  //   setItems(getRandomItems());
  // }, []);

  return (
    <div
      className="lines-background fixed inset-0 -z-[1] pointer-events-none overflow-hidden text-[var(--foreground)]"
      aria-hidden={true}
      suppressHydrationWarning
    >
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {items.map(({ Icon, x, y, size, duration, delay }, i) => (
          <span
            key={i}
            className="lines-background__icon absolute text-[var(--foreground)] opacity-[0.06]"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          >
            <Icon className="w-full h-full" strokeWidth={1.2} />
          </span>
        ))}
      </div> */}
    </div>
  );
}
