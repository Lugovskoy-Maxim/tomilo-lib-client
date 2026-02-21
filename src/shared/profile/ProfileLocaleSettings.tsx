import { UserProfile, UserLocale } from "@/types/user";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import { Languages, Check } from "lucide-react";

interface ProfileLocaleSettingsProps {
  userProfile: UserProfile;
}

const LOCALE_OPTIONS: { value: UserLocale; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

export default function ProfileLocaleSettings({
  userProfile,
}: ProfileLocaleSettingsProps) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  const currentLocale: UserLocale = userProfile.locale ?? "ru";

  const handleLocaleChange = async (locale: UserLocale) => {
    if (isLoading || locale === currentLocale) return;
    try {
      await updateProfile({ locale }).unwrap();
      toast.success("Язык сохранён");
    } catch (error) {
      console.error("Ошибка при сохранении языка:", error);
      toast.error("Не удалось сохранить настройки");
    }
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <Languages className="w-5 h-5 text-[var(--chart-1)]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            Язык интерфейса
          </h2>
          <p className="text-[var(--muted-foreground)] text-xs">
            Выберите язык сайта
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {LOCALE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleLocaleChange(value)}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              currentLocale === value
                ? "bg-[var(--chart-1)] border-[var(--chart-1)] text-white shadow-md"
                : "bg-transparent border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {label}
            {currentLocale === value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}
