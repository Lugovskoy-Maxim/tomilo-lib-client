"use client";

import { 
  BookOpen, 
  ShoppingBag, 
  Compass, 
  Sparkles,
  Settings,
  Trophy
} from "lucide-react";
import Link from "next/link";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "catalog",
    label: "Каталог",
    description: "Найти новую мангу",
    href: "/catalog",
    icon: Compass,
    color: "text-blue-500",
    bgColor: "bg-blue-500/15",
    borderColor: "border-blue-500/30",
  },
  {
    id: "shop",
    label: "Магазин",
    description: "Декорации и предметы",
    href: "/tomilo-shop",
    icon: ShoppingBag,
    color: "text-amber-500",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
  },
  {
    id: "recommendations",
    label: "Для вас",
    description: "Персональные подборки",
    href: "/recommendations",
    icon: Sparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-500/15",
    borderColor: "border-purple-500/30",
  },
  {
    id: "achievements",
    label: "Достижения",
    description: "Ваши награды",
    href: "/profile?tab=achievements",
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/15",
    borderColor: "border-yellow-500/30",
  },
];

interface ProfileQuickActionsProps {
  className?: string;
}

export default function ProfileQuickActions({ className = "" }: ProfileQuickActionsProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${className}`}>
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.id}
            href={action.href}
            className={`flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] transition-colors ${action.bgColor}`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${action.bgColor}`}>
              <Icon className={`w-4 h-4 ${action.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">{action.label}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] truncate hidden sm:block">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
