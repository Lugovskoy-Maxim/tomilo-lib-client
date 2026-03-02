import { UserDisplaySettings } from "@/types/user";
import ThemeToggleGroup from "@/shared/theme-toggle/ThemeToggleGroup";
import { Palette, HelpCircle } from "lucide-react";
import Tooltip from "@/shared/ui/Tooltip";

interface ProfileThemeSettingsProps {
  displaySettings: UserDisplaySettings;
  isLoading?: boolean;
}

export default function ProfileThemeSettings(_props: ProfileThemeSettingsProps) {
  void _props;
  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
            <Palette className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Тема оформления
            </h2>
            <p className="text-[var(--muted-foreground)] text-xs">
              Светлая, тёмная или по системе
            </p>
          </div>
        </div>
        <Tooltip
          content={
            <div className="space-y-2 max-w-[280px]">
              <p className="font-medium">Выбор темы</p>
              <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)]">
                <li><strong>Светлая</strong> — классическая светлая тема</li>
                <li><strong>Тёмная</strong> — тёмная тема, бережёт глаза в темноте</li>
                <li><strong>Системная</strong> — автоматически подстраивается под настройки вашего устройства</li>
              </ul>
            </div>
          }
          position="left"
          trigger="click"
        >
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <ThemeToggleGroup />
    </div>
  );
}
