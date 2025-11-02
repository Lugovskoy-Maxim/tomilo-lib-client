import {
  Bookmark,
  BookOpenCheck,
  Calendar1,
  ChevronsUp,
  Mail,
} from "lucide-react";
import { UserProfile } from "@/types/user";
import ProfileStats from "./profile-stats";

interface UserInfoProps {
  userProfile: UserProfile;
}

export default function UserInfo({ userProfile }: UserInfoProps) {
  return (
    <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between">
      <div className="mb-4 ml-40 lg:mb-0">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">
          {userProfile.username}
        </h1>
        <div className="flex items-center space-x-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              userProfile.role === "admin"
                ? "bg-red-500/10 text-red-600"
                : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}
          >
            {userProfile.role === "admin" ? "Администратор" : "Пользователь"}
          </span>
        </div>
      </div>

      <UserStats userProfile={userProfile} />
    </div>
  );
}

function UserStats({ userProfile }: { userProfile: UserProfile }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
      <div className="flex items-center space-x-1">
        <Mail className="w-4 h-4" />
        <span className="text-xs">{userProfile.email}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Calendar1 className="w-4 h-4" />
        <span className="text-xs">
          С {new Date(userProfile.createdAt).toLocaleDateString("ru-RU")}
        </span>
      </div>
      <div className="flex items-center space-x-1">
        <Bookmark className="w-4 h-4" />
        <span className="text-xs">{userProfile.bookmarks.length} закладок</span>
      </div>
    </div>
  );
}
