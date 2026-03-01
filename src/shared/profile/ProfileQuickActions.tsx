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
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.id}
            href={action.href}
            className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border ${action.borderColor} ${action.bgColor} hover:scale-[1.02] hover:shadow-md transition-all duration-300 overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10 pointer-events-none transform translate-x-6 -translate-y-6">
              <Icon className="w-full h-full" />
            </div>
            
            <div className={`p-2.5 rounded-xl ${action.bgColor} border ${action.borderColor} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`w-5 h-5 ${action.color}`} />
            </div>
            
            <div className="text-center relative z-10">
              <p className={`text-sm font-semibold ${action.color} group-hover:brightness-110 transition-all`}>
                {action.label}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 hidden sm:block">
                {action.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
