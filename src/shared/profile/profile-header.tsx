"use client";
import { Edit3, Calendar, Mail, User, Bookmark } from "lucide-react";
import { UserProfile } from "@/types/user";
import Image from "next/image";

interface ProfileHeaderProps {
  userProfile: UserProfile;
  onEdit: () => void;
}

export default function ProfileHeader({
  userProfile,
  onEdit,
}: ProfileHeaderProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (username: string): string => {
    return username[0].toUpperCase();
  };

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';

  return (
    <div className="bg-[var(--secondary)] rounded-xl p-8 border border-[var(--border)] mb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-6">
        {/* Аватар */}
        <div className="relative">
          {userProfile.avatar ? (
            <Image
              src={`${baseUrl}${userProfile.avatar}`}
              alt={userProfile.username}
              className="w-24 h-24 rounded-full object-cover"
            ></Image>
          ) : (
            <div className="w-24 h-24 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold">
              {getInitials(userProfile.username)}
            </div>
          )}
          <button
            onClick={onEdit}
            className="absolute bottom-0 right-0 p-2 bg-[var(--primary)] text-white rounded-full hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Информация */}
        <div className="flex-1">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                {userProfile.username}
              </h1>
              <div className="flex items-center space-x-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    userProfile.role === "admin"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-[var(--primary)]/10 text-[var(--primary)]"
                  }`}
                >
                  {userProfile.role === "admin"
                    ? "Администратор"
                    : "Пользователь"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>{userProfile.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>С {formatDate(userProfile.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Bookmark className="w-4 h-4" />
              <span>{userProfile.bookmarks.length} закладок</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{userProfile.readingHistory.length} в истории</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
