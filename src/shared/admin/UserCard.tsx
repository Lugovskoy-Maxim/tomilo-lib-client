import React from "react";
import { Trash2, Eye } from "lucide-react";
import { UserProfile } from "@/types/user";
import Image from "next/image";

interface UserCardProps {
  user: UserProfile;
  onView: (userId: string) => void;
  onDelete: (id: string, username: string) => void;
  normalizeUrl: (url: string) => string;
  formatDate: (dateString: string) => string;
}

export function UserCard({ user, onView, onDelete, normalizeUrl, formatDate }: UserCardProps) {
  const roleBadgeClass =
    user.role === "admin"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
      : user.role === "moderator"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";

  const roleLabel =
    user.role === "admin" ? "Админ" : user.role === "moderator" ? "Модератор" : "Пользователь";

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--admin-radius)] p-4 card-hover-soft shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 bg-[var(--secondary)] rounded-full flex items-center justify-center flex-shrink-0">
          {user.avatar ? (
            <Image
              src={normalizeUrl(user.avatar || "")}
              alt={user.username}
              width={48}
              height={48}
              unoptimized
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-[var(--secondary)] rounded-full flex items-center justify-center">
              <span className="text-base font-medium text-[var(--muted-foreground)]">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--foreground)] truncate">{user.username}</h3>
            <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5" title={user.email}>
              {user.email}
            </p>
            <p className="mt-1 text-[11px] font-mono text-[var(--muted-foreground)] break-all">
              {user._id}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onView(user._id)}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded-md transition-colors"
            title="Просмотреть профиль"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(user._id, user.username)}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            title="Удалить пользователя"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 px-2.5 py-2">
          <p className="text-[11px] text-[var(--muted-foreground)]">Роль</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass}`}>
            {roleLabel}
          </span>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 px-2.5 py-2">
          <p className="text-[11px] text-[var(--muted-foreground)]">Уровень</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{user.level || 1}</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/20 px-2.5 py-2">
        <p className="text-[11px] text-[var(--muted-foreground)]">Дата регистрации</p>
        <p className="mt-1 text-sm text-[var(--foreground)]">{formatDate(user.createdAt)}</p>
      </div>
    </div>
  );
}