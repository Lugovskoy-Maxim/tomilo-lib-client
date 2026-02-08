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
      className="absolute top-full right-0 mt-3 w-64 dropdown-modern z-50"
      onClick={e => e.stopPropagation()}
    >
      {/* Заголовок с информацией о пользователе */}
      <div className="p-4 border-b border-[var(--border)]/50 bg-gradient-to-r from-[var(--secondary)]/50 to-transparent">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <UserAvatar
              avatarUrl={user?.avatar}
              username={user?.username || user?.name}
              size={56}
              className="border-2 border-[var(--background)] shadow-lg"
              
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--foreground)] truncate">
              {user?.name || user?.username || "Пользователь"}
            </p>
            {user?.email && (
              <p className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</p>
            )}
            {/* Отображение ранга */}
            {user?.level !== undefined && user.level > 0 && (
              <div className="mt-1">
                <span className="text-xs font-medium text-[var(--chart-1)]">
                  {getRankDisplay(user.level)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Основное меню */}
      <div className="max-h-96 overflow-y-auto">
        {/* Кнопка 18+ контента */}
        <div className="p-3">
          <button
            type="button"
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer ${
              isAdult
                ? "bg-green-500/10 text-green-600 border border-green-500/30"
                : "bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] border border-[var(--border)]/50"
            }`}
            onClick={handleToggleAdult}
          >
            <div className="flex items-center space-x-3">
              <Eye
                className={`w-4 h-4 ${isAdult ? "text-green-600" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"}`}
              />
              <span
                className={`font-medium text-sm ${isAdult ? "text-green-600" : "text-[var(--foreground)]"}`}
              >
                18+ контент
              </span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${isAdult ? "bg-green-500/20 text-green-600" : "bg-[var(--border)]/50 text-[var(--muted-foreground)]"}`}
            >
              {isAdult ? "Вкл" : "Выкл"}
            </span>
          </button>
        </div>

        <div className="px-2 pb-2 space-y-0.5">
          {menuItems.map(item => (
            <div key={item.id}>
              <button
                type="button"
                className="w-full flex items-center px-4 py-2.5 rounded-lg hover:bg-[var(--secondary)] transition-colors duration-200 cursor-pointer"
                onClick={item.onClick}
              >
                <item.icon className="w-4 h-4 text-[var(--chart-1)] mr-3" />
                <span className="font-medium text-sm text-[var(--foreground)]">
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* Админ меню */}
        {isAdmin && (
          <>
            <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            <div className="px-2 pb-2 space-y-0.5">
              {adminMenuItems.map(item => (
                <div key={item.id}>
                  <button
                    type="button"
                    className="w-full flex items-center px-4 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors duration-200 cursor-pointer"
                    onClick={item.onClick}
                  >
                    <item.icon className="w-4 h-4 text-[var(--destructive)] mr-3" />
                    <span className="font-medium text-sm text-[var(--foreground)]">
                      {item.label}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Разделитель */}
        <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        {/* Кнопка выхода */}
        <div className="p-2">
          <button
            type="button"
            className="w-full flex items-center px-4 py-2.5 rounded-lg hover:bg-red-500/10 text-red-600 transition-colors duration-200 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span className="font-medium text-sm">Выйти</span>
          </button>
        </div>
      </div>

      {/* Футер с версией */}
      <div className="px-4 py-3 border-t border-[var(--border)]/50 bg-[var(--secondary)]/30">
        <p className="text-xs text-[var(--muted-foreground)] text-center font-medium">
          {user?.id ? `ID: ${user.id}` : "Неавторизован"}
        </p>
      </div>
    </div>
  );
}
