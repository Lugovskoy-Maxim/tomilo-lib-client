import React, { useState } from "react";
import { Trash2, Eye, Shield, Crown, User, Calendar, TrendingUp, MoreHorizontal, Copy, Check } from "lucide-react";
import { UserProfile } from "@/types/user";
import Image from "next/image";

interface UserCardProps {
  user: UserProfile;
  onView: (userId: string) => void;
  onDelete: (id: string, username: string) => void;
  normalizeUrl: (url: string) => string;
  formatDate: (dateString: string) => string;
}

const roleConfig = {
  admin: {
    label: "Админ",
    icon: Crown,
    bgClass: "bg-gradient-to-r from-red-500/20 to-orange-500/20",
    textClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-500/30",
    badgeClass: "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/25",
  },
  moderator: {
    label: "Модератор",
    icon: Shield,
    bgClass: "bg-gradient-to-r from-blue-500/20 to-indigo-500/20",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500/30",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25",
  },
  user: {
    label: "Пользователь",
    icon: User,
    bgClass: "bg-[var(--secondary)]/50",
    textClass: "text-[var(--muted-foreground)]",
    borderClass: "border-[var(--border)]",
    badgeClass: "bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]",
  },
};

export function UserCard({ user, onView, onDelete, normalizeUrl, formatDate }: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user;
  const RoleIcon = config.icon;

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(user._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const levelProgress = Math.min(((user.level || 1) % 10) * 10, 100);

  return (
    <div
      className={`
        group relative overflow-hidden
        bg-[var(--card)] border rounded-xl
        transition-all duration-300 ease-out
        hover:shadow-lg hover:shadow-[var(--primary)]/5
        hover:-translate-y-0.5
        ${config.borderClass}
        ${isHovered ? "border-[var(--primary)]/50" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
    >
      <div className={`absolute inset-0 opacity-50 ${config.bgClass}`} />
      
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className={`
              w-12 h-12 rounded-xl overflow-hidden
              ring-2 ring-offset-2 ring-offset-[var(--card)]
              transition-all duration-300
              ${isHovered ? "ring-[var(--primary)]/50 scale-105" : "ring-transparent"}
            `}>
              {user.avatar ? (
                <Image
                  src={normalizeUrl(user.avatar)}
                  alt={user.username}
                  width={48}
                  height={48}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center">
                  <span className="text-lg font-bold text-[var(--primary)]">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className={`
              absolute -bottom-1 -right-1 w-5 h-5 rounded-full
              flex items-center justify-center
              ${config.badgeClass}
              shadow-sm
            `}>
              <RoleIcon className="w-3 h-3" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--foreground)] truncate text-sm leading-tight">
                  {user.username}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                  {user.email}
                </p>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className={`
                    p-1.5 rounded-lg transition-all duration-200
                    ${showActions 
                      ? "bg-[var(--accent)] text-[var(--foreground)]" 
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                    }
                  `}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div 
              className={`
                flex items-center gap-1 mt-1.5 text-[10px] font-mono text-[var(--muted-foreground)]
                cursor-pointer hover:text-[var(--foreground)] transition-colors
              `}
              onClick={handleCopyId}
              title="Копировать ID"
            >
              {copiedId ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 opacity-50" />
                  <span className="truncate">{user._id}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div 
          className={`
            overflow-hidden transition-all duration-300 ease-out
            ${showActions ? "max-h-16 opacity-100 mt-3" : "max-h-0 opacity-0"}
          `}
        >
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
            <button
              onClick={() => onView(user._id)}
              className="
                flex-1 flex items-center justify-center gap-1.5 
                px-3 py-2 rounded-lg text-xs font-medium
                bg-[var(--primary)]/10 text-[var(--primary)]
                hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]
                transition-all duration-200 active:scale-[0.98]
              "
            >
              <Eye className="w-3.5 h-3.5" />
              Профиль
            </button>
            <button
              onClick={() => onDelete(user._id, user.username)}
              className="
                flex items-center justify-center gap-1.5 
                px-3 py-2 rounded-lg text-xs font-medium
                bg-red-500/10 text-red-600 dark:text-red-400
                hover:bg-red-500 hover:text-white
                transition-all duration-200 active:scale-[0.98]
              "
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-lg bg-[var(--secondary)]/50 px-2.5 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <RoleIcon className={`w-3 h-3 ${config.textClass}`} />
            </div>
            <span className={`text-[10px] font-medium ${config.textClass}`}>
              {config.label}
            </span>
          </div>
          
          <div className="rounded-lg bg-[var(--secondary)]/50 px-2.5 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-[var(--primary)]" />
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-sm font-bold text-[var(--foreground)]">{user.level || 1}</span>
              <span className="text-[9px] text-[var(--muted-foreground)]">ур.</span>
            </div>
          </div>
          
          <div className="rounded-lg bg-[var(--secondary)]/50 px-2.5 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Calendar className="w-3 h-3 text-[var(--muted-foreground)]" />
            </div>
            <span className="text-[10px] text-[var(--foreground)]">
              {formatDate(user.createdAt)}
            </span>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[var(--muted-foreground)]">Прогресс уровня</span>
            <span className="text-[9px] font-medium text-[var(--foreground)]">{levelProgress}%</span>
          </div>
          <div className="h-1 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--chart-1)] rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div 
        className={`
          absolute inset-0 pointer-events-none
          bg-gradient-to-t from-[var(--primary)]/5 to-transparent
          opacity-0 transition-opacity duration-300
          ${isHovered ? "opacity-100" : ""}
        `}
      />
    </div>
  );
}
