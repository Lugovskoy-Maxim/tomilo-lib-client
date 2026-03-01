"use client";

import { BookOpen, Users, Eye, TrendingUp, Sparkles } from "lucide-react";
import { useGetSiteStatsQuery } from "@/store/api/statsApi";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, label, value, subtext, color, bgColor }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 bg-[var(--card)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-300 group">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
      </div>
      <div className="min-w-0">
        <div className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
          {value}
        </div>
        <div className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">
          {label}
          {subtext && <span className="hidden sm:inline"> {subtext}</span>}
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function QuickStats() {
  const { data, isLoading } = useGetSiteStatsQuery();

  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 sm:h-20 bg-[var(--card)] rounded-xl border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const stats = data?.data;
  
  const statsData = [
    {
      icon: BookOpen,
      label: "Тайтлов",
      value: formatNumber(stats?.totalTitles || 2500),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Sparkles,
      label: "Глав",
      value: formatNumber(stats?.totalChapters || 85000),
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Users,
      label: "Пользователей",
      value: formatNumber(stats?.totalUsers || 15000),
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Eye,
      label: "Просмотров",
      value: formatNumber(stats?.totalViews || 1200000),
      subtext: "всего",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </section>
  );
}
