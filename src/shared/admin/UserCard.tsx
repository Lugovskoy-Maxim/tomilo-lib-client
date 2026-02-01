import React from "react";
import { Trash2, Eye } from "lucide-react";
import { UserProfile } from "@/types/user";

interface UserCardProps {
  user: UserProfile;
  onView: (userId: string) => void;
  onDelete: (id: string, username: string) => void;
  normalizeUrl: (url: string) => string;
  formatDate: (dateString: string) => string;
}

export function UserCard({ user, onView, onDelete, normalizeUrl, formatDate }: UserCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-[var(--secondary)] rounded-full flex items-center justify-center flex-shrink-0">
          {user.avatar ? (
            <img
              src={normalizeUrl(user.avatar || "")}
              alt={user.username}
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
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-[var(--foreground)] truncate">{user.username}</h3>
              <p className="text-xs text-[var(--muted-foreground)] truncate">ID: {user._id.slice(-8)}</p>
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
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-[var(--foreground)] truncate" title={user.email}>
              {user.email}
            </p>
            
            <div className="flex flex-wrap gap-1 mt-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "admin"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    : user.role === "moderator"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {user.role === "admin"
                  ? "Админ"
                  : user.role === "moderator"
                    ? "Модератор"
                    : "Пользователь"}
              </span>
              
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                Уровень {user.level || 1}
              </span>
            </div>
            
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              Регистрация: {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}