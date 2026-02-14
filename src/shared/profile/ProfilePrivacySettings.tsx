import { UserProfile, UserPrivacy } from "@/types/user";
import { Check, Lock } from "lucide-react";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

interface ProfilePrivacySettingsProps {
  userProfile: UserProfile;
}

const VISIBILITY_LABELS: Record<string, string> = {
  public: "Публично",
  friends: "Друзья",
  private: "Приватно",
};

export default function ProfilePrivacySettings({ userProfile }: ProfilePrivacySettingsProps) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  const currentPrivacy = userProfile.privacy || {
    profileVisibility: "public",
    readingHistoryVisibility: "private",
  };

  const handlePrivacySettingChange = async (setting: keyof UserPrivacy, value: string) => {
    if (isLoading) return;
    try {
      await updateProfile({
        privacy: {
          ...currentPrivacy,
          [setting]: value,
        },
      }).unwrap();
      toast.success("Настройки приватности обновлены");
    } catch (error) {
      console.error("Ошибка при сохранении настроек приватности:", error);
      toast.error("Не удалось сохранить настройки");
    }
  };

  const options: { value: "public" | "friends" | "private"; label: string }[] = [
    { value: "public", label: VISIBILITY_LABELS.public },
    { value: "friends", label: VISIBILITY_LABELS.friends },
    { value: "private", label: VISIBILITY_LABELS.private },
  ];

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <Lock className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            Приватность
          </h2>
          <p className="text-[var(--muted-foreground)] text-xs">
            Кто может видеть ваш профиль и историю
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <span className="text-sm font-semibold text-[var(--foreground)] block mb-2">
            Видимость профиля
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Кто может просматривать вашу страницу
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePrivacySettingChange("profileVisibility", option.value)}
                disabled={isLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                  currentPrivacy.profileVisibility === option.value
                    ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                    : "bg-transparent border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {option.label}
                {currentPrivacy.profileVisibility === option.value && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <span className="text-sm font-semibold text-[var(--foreground)] block mb-2">
            История чтения
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Кто может видеть, что вы читаете
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePrivacySettingChange("readingHistoryVisibility", option.value)}
                disabled={isLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                  currentPrivacy.readingHistoryVisibility === option.value
                    ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                    : "bg-transparent border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {option.label}
                {currentPrivacy.readingHistoryVisibility === option.value && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
