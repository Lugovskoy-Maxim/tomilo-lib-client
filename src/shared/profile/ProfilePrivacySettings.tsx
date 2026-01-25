import { UserProfile, UserPrivacy } from "@/types/user";
import { Check } from "lucide-react";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

interface ProfilePrivacySettingsProps {
  userProfile: UserProfile;
}

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

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4">
      <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-3 sm:mb-4">
        Приватность
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {/* Видимость профиля */}
        <div>
          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] block mb-2">
            Профиль
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(["public", "friends", "private"] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handlePrivacySettingChange("profileVisibility", option)}
                disabled={isLoading}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
                  currentPrivacy.profileVisibility === option
                    ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {option === "public" && "Публичн."}
                {option === "friends" && "Друзья"}
                {option === "private" && "Приват."}
                {currentPrivacy.profileVisibility === option && (
                  <Check className="w-3 h-3 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Видимость истории */}
        <div>
          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] block mb-2">
            История чтения
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(["public", "friends", "private"] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handlePrivacySettingChange("readingHistoryVisibility", option)}
                disabled={isLoading}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
                  currentPrivacy.readingHistoryVisibility === option
                    ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {option === "public" && "Публичн."}
                {option === "friends" && "Друзья"}
                {option === "private" && "Приват."}
                {currentPrivacy.readingHistoryVisibility === option && (
                  <Check className="w-3 h-3 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
