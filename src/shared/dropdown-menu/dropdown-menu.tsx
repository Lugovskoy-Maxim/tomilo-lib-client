// components/UserDropdown.tsx
"use client";
import { useState } from "react";
import { 
  User, 
  Settings,  
  Bookmark, 
  History, 
  LogOut,
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { UserAvatar } from "..";
 
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
  };
}

export default function UserDropdown({ isOpen, onClose, onLogout, user }: UserDropdownProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'profile',
      icon: User,
      label: 'Профиль',
      onClick: () => router.push('/profile'),
    },
    {
      id: 'bookmarks',
      icon: Bookmark,
      label: 'Закладки',
      onClick: () => router.push('/profile?tab=bookmarks'),
    },
    {
      id: 'history',
      icon: History,
      label: 'История чтения',
      onClick: () => router.push('/profile?tab=history'),
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Настройки',
      onClick: () => router.push('/settings'),
    },
  ];

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div
      className="absolute top-full right-0 mt-3 w-60 bg-[var(--background)] rounded-xl shadow-xl border border-[var(--border)] z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Заголовок с информацией о пользователе */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--secondary)]">
        <div className="flex items-center space-x-3">
          <UserAvatar
            avatarUrl={user?.avatar}
            username={user?.username || user?.name}
            size={40}
            className="border-2 border-[var(--background)]"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--foreground)] truncate">
              {user?.name || user?.username || 'Пользователь'}
            </p>
            {user?.email && (
              <p className="text-sm text-[var(--muted-foreground)] truncate">
                {user.email}
              </p>
            )}
            {/* Информация о уровне, опыте и балансе */}
            <div className="flex items-center gap-2 mt-2">
              <div className="px-2 py-1 border border-[var(--border)] font-medium bg-[var(--chart-1)] rounded-lg text-[var(--primary)] text-xs">
                {user?.level || 0}
              </div>
              <div className="px-2 py-1 border border-[var(--border)] font-medium bg-[var(--chart-2)] rounded-lg text-[var(--primary)] text-xs">
                {user?.experience || 0} XP
              </div>
              <div className="px-2 py-1 border border-[var(--border)] font-medium bg-[var(--chart-3)] rounded-lg text-[var(--primary)] text-xs">
                {user?.balance || 0} ₽
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основное меню */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-2 space-y-1">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--secondary)] transition-colors cursor-pointer group ${
                  activeSubmenu === item.id ? 'bg-[var(--secondary)]' : ''
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
          {user?.id ? `ID: ${user.id}` : 'Неавторизован'}
        </p>
      </div>
    </div>
  );
}