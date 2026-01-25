// components/UserDropdown.tsx
"use client";
import { useState, useEffect } from "react";
import {
  User,
  Settings,
  Bookmark,
  History,
  LogOut,
  CircleDollarSign,
  Shield,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "..";
import { getRankDisplay } from "@/lib/rank-utils";
import { useUpdateProfileMutation } from "@/store/api/authApi";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
    level?: number;
    experience?: number;
    balance?: number;
    role?: string;
    birthDate?: string;
    displaySettings?: {
      isAdult?: boolean;
      theme?: "light" | "dark" | "system";
    };
  };
}

export default function UserDropdown({ isOpen, onClose, onLogout, user }: UserDropdownProps) {
  const [activeSubmenu] = useState<string | null>(null);
  const router = useRouter();
  const [updateProfile] = useUpdateProfileMutation();
  const [adultEnabled, setAdultEnabled] = useState(user?.displaySettings?.isAdult || false);

  // Update local state when user data changes
  useEffect(() => {
    if (user?.displaySettings?.isAdult !== undefined) {
      setAdultEnabled(user.displaySettings.isAdult);
    }
  }, [user?.displaySettings?.isAdult]);

  if (!isOpen) return null;

  const isAdmin = user?.role === "admin";
  const isAdult = adultEnabled;

  const handleToggleAdult = async () => {
    const newValue = !adultEnabled;
    setAdultEnabled(newValue); // Update local state immediately

    try {
      await updateProfile({
        displaySettings: {
          isAdult: newValue,
          theme: user?.displaySettings?.theme || "system",
        },
      }).unwrap();
    } catch (error) {
      // Revert on error
      setAdultEnabled(!newValue);
      console.error("Ошибка при обновлении настроек:", error);
    }
  };

  const menuItems = [
    {
      id: "profile",
      icon: User,
      label: "Профиль",
      onClick: () => router.push("/profile"),
    },
    {
      id: "bookmarks",
      icon: Bookmark,
      label: "Закладки",
      onClick: () => router.push("/profile?tab=bookmarks"),
    },
    {
      id: "history",
      icon: History,
      label: "История чтения",
      onClick: () => router.push("/profile?tab=history"),
    },
    // {
    //   id: "settings",
    //   icon: Settings,
    //   label: "Настройки",
    //   onClick: () => router.push("/settings"),
    // },
  ];

  const adminMenuItems = [
    {
      id: "admin",
      icon: Shield,
      label: "Админ панель",
      onClick: () => router.push("/admin"),
    },
  ];

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div
      className="absolute top-full right-0 mt-3 w-60 bg-[var(--background)] rounded-xl shadow-xl border border-[var(--border)] z-50 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Заголовок с информацией о пользователе */}
      <div className="p-2 border-b border-[var(--border)] bg-[var(--secondary)]">
        <div className="flex items-center space-x-3">
          <UserAvatar
            avatarUrl={user?.avatar}
            username={user?.username || user?.name}
            size={60}
            className="border-2 border-[var(--background)]"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--foreground)] truncate">
              {user?.name || user?.username || "Пользователь"}
            </p>
            {user?.email && (
              <p className="text-sm text-[var(--muted-foreground)] truncate">{user.email}</p>
            )}
            {/* Информация о уровне, опыте и балансе */}
            {/* <div className="flex items-center gap-2 mt-2">
              <div className="px-2 py-1 border border-[var(--border)] font-medium bg-[var(--chart-1)] rounded-lg text-[var(--primary)] text-xs">
                {user?.level || 0}
              </div>
              <div className="px-2 py-1 border border-[var(--border)] font-medium bg-[var(--chart-2)] rounded-lg text-[var(--primary)] text-xs">
                {user?.experience || 0} XP
              </div>
              <div className="px-2 py-1 border border-[var(--border)] font-medium bg-[var(--chart-3)] rounded-lg text-[var(--primary)] text-xs">
                {user?.balance || 0} <CircleDollarSign className="w-3 h-3 inline" />
              </div>
            </div> */}
            {/* Отображение ранга силы */}
            {user?.level !== undefined && (
              <div className="mt-1">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Ранг: {getRankDisplay(user.level)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Основное меню */}
      <div className="max-h-96 overflow-y-auto">
        {/* Кнопка 18+ контента */}
        {user?.birthDate && (
          <div className="p-2">
            <button
              type="button"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${
                isAdult
                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                  : "bg-[var(--secondary)] hover:bg-[var(--secondary)]/80"
              }`}
              onClick={handleToggleAdult}
            >
              <div className="flex items-center space-x-3">
                <Eye
                  className={`w-4 h-4 ${isAdult ? "text-green-600" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"}`}
                />
                <span
                  className={`font-medium ${isAdult ? "text-green-600" : "text-[var(--foreground)] group-hover:text-[var(--primary)]"}`}
                >
                  18+ контент
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${isAdult ? "bg-green-500/20" : "bg-[var(--border)]"}`}
              >
                {isAdult ? "Вкл" : "Выкл"}
              </span>
            </button>
          </div>
        )}

        <div className="p-2 space-y-1">
          {menuItems.map(item => (
            <div key={item.id}>
              <button
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--secondary)] transition-colors cursor-pointer group ${
                  activeSubmenu === item.id ? "bg-[var(--secondary)]" : ""
                }`}
                onClick={item.onClick}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
                  <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">
                    {item.label}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Админ меню */}
        {isAdmin && (
          <>
            <hr className="my-2 border-[var(--border)]" />
            <div className="p-2 space-y-1">
              {adminMenuItems.map(item => (
                <div key={item.id}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--primary)]/10 transition-colors cursor-pointer group"
                    onClick={item.onClick}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">
                        {item.label}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Разделитель */}
        <hr className="my-2 border-[var(--border)]" />

        {/* Кнопка выхода */}
        <div className="p-2">
          <button
            type="button"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-600 transition-colors cursor-pointer group"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </div>

      {/* Футер с версией */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--secondary)]">
        <p className="text-xs text-[var(--muted-foreground)] text-center">
          {user?.id ? `ID: ${user.id}` : "Неавторизован"}
        </p>
      </div>
    </div>
  );
}
