import { UserProfile } from "@/types/user";
import { Palette } from "lucide-react";
import { ThemeToggle } from "@/shared";

interface ProfileThemeSettingsProps {
  userProfile: UserProfile;
}

export default function ProfileThemeSettings({ userProfile }: ProfileThemeSettingsProps) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-3 mb-4">
        <Palette className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Внешний вид</h2>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-[var(--foreground)]">Тема</span>
          <p className="text-xs text-[var(--muted-foreground)]">Цветовая схема интерфейса</p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
