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
    <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div className="mb-2 sm:ml-40 lg:mb-0 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
              {userProfile.username}
            </h1>
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 rounded-full border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all duration-300 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Role badge with enhanced styling */}
        <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              isAdmin
                ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-600 border border-red-500/30 shadow-lg shadow-red-500/10"
                : "bg-gradient-to-r from-[var(--primary)]/20 to-[var(--chart-1)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
            }`}
          >
            {isAdmin ? (
              <>
                <Shield className="w-3 h-3" />
                Администратор
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Культиватор
              </>
            )}
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
    <div className="flex flex-col gap-2 text-xs sm:text-sm text-[var(--muted-foreground)]">
      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-lg">
          <Mail className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span className="font-medium">{userProfile.email}</span>
        </div>
        
        {userProfile.birthDate && (
          <div className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-lg">
            <Calendar1 className="w-3.5 h-3.5 text-[var(--chart-1)]" />
            <span className="font-medium">{formatBirthDate(userProfile.birthDate)}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center sm:justify-start gap-1.5 glass px-2.5 py-1 rounded-lg w-fit mx-auto sm:mx-0">
        <Calendar1 className="w-3.5 h-3.5 text-[var(--chart-2)]" />
        <span className="font-medium">
          С нами с {new Date(userProfile.createdAt).toLocaleDateString("ru-RU")}
        </span>
      </div>
    </div>
  );
}
