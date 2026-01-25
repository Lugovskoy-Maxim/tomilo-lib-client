import { Bookmark, Calendar1, Mail } from "lucide-react";
import { UserProfile } from "@/types/user";
import { Button } from "@/shared/ui/button";
import { Pencil } from "lucide-react";

interface UserInfoProps {
  userProfile: UserProfile;
  onEdit?: () => void;
}

export default function UserInfo({ userProfile, onEdit }: UserInfoProps) {
  const formatBirthDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    const formattedDate = date.toLocaleDateString("ru-RU");
    return `${formattedDate} (${age} ${getAgeEnding(age)})`;
  };

  const getAgeEnding = (age: number) => {
    const mod10 = age % 10;
    const mod100 = age % 100;
    if (mod100 >= 11 && mod100 <= 19) return "лет";
    if (mod10 === 1) return "год";
    if (mod10 >= 2 && mod10 <= 4) return "года";
    return "лет";
  };

  return (
    <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between">
      <div className="mb-4 sm:ml-40 lg:mb-0 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1">
            {userProfile.username}
          </h1>
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 rounded-full border-[var(--border)] cursor-pointer self-center sm:self-auto"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
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

      <UserStats userProfile={userProfile} formatBirthDate={formatBirthDate} />
    </div>
  );
}

function UserStats({
  userProfile,
  formatBirthDate,
}: {
  userProfile: UserProfile;
  formatBirthDate: (dateStr: string) => string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
      <div className="flex items-center space-x-1">
        <Mail className="w-4 h-4" />
        <span className="text-xs">{userProfile.email}</span>
        {userProfile.birthDate && (
          <>
            <span className="mx-2">•</span>
            <Calendar1 className="w-4 h-4" />
            <span className="text-xs font-medium">{formatBirthDate(userProfile.birthDate)}</span>
          </>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <Calendar1 className="w-4 h-4" />
        <span className="text-xs">
          Культивирует с {new Date(userProfile.createdAt).toLocaleDateString("ru-RU")}
        </span>
      </div>
      {/* <div className="flex items-center space-x-1">
        <Bookmark className="w-4 h-4" />
        <span className="text-xs">{userProfile.bookmarks.length} закладок</span>
      </div> */}
    </div>
  );
}
