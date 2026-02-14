import { Calendar1, Mail, Sparkles, Shield } from "lucide-react";
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

  const isAdmin = userProfile.role === "admin";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight truncate">
            {userProfile.username}
          </h1>
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 rounded-lg border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors shrink-0"
              aria-label="Редактировать профиль"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-medium ${
            isAdmin
              ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20"
              : "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
          }`}
        >
          {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isAdmin ? "Администратор" : "Культиватор"}
        </span>
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
    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[var(--muted-foreground)]">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)]/50">
        <Mail className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
        <span className="truncate max-w-[180px] sm:max-w-none">{userProfile.email}</span>
      </span>
      {userProfile.birthDate && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)]/50">
          <Calendar1 className="w-3.5 h-3.5 text-[var(--chart-1)] shrink-0" />
          {formatBirthDate(userProfile.birthDate)}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)]/50">
        <Calendar1 className="w-3.5 h-3.5 text-[var(--chart-2)] shrink-0" />
        С {new Date(userProfile.createdAt).toLocaleDateString("ru-RU")}
      </span>
    </div>
  );
}
