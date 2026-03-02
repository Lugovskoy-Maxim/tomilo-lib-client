"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/types/user";
import { Button } from "@/shared/ui/button";
import Input from "@/shared/ui/input";
import { Calendar, Mail, User, FileText, Heart, MessageCircle, AtSign } from "lucide-react";
import { SocialLinks } from "@/types/user";
import { GENRES } from "@/constants/genres";

interface ProfileEditFormProps {
  userProfile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => void | Promise<void>;
  onCancel: () => void;
  /** Блокировать форму во время отправки */
  isLoading?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) return "Введите имя пользователя";
  if (trimmed.length < 2) return "Имя не короче 2 символов";
  return null;
}

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Введите email";
  if (!EMAIL_REGEX.test(trimmed)) return "Некорректный email";
  return null;
}

/** Приводит дату к формату YYYY-MM-DD для input type="date" */
function toDateInputValue(dateStr: string | undefined): string {
  if (!dateStr || !dateStr.trim()) return "";
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return "";
  }
}

export default function ProfileEditForm({
  userProfile,
  onSave,
  onCancel,
  isLoading = false,
}: ProfileEditFormProps) {
  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email);
  const [birthDate, setBirthDate] = useState(toDateInputValue(userProfile.birthDate));
  const [bio, setBio] = useState(userProfile.bio ?? "");
  const [favoriteGenre, setFavoriteGenre] = useState(userProfile.favoriteGenre ?? "");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    telegram: userProfile.socialLinks?.telegram ?? "",
    discord: userProfile.socialLinks?.discord ?? "",
    vk: userProfile.socialLinks?.vk ?? "",
  });
  const [errors, setErrors] = useState<{ username?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ username?: boolean; email?: boolean }>({});

  // Синхронизация с актуальным профилем при открытии модалки
  useEffect(() => {
    setUsername(userProfile.username);
    setEmail(userProfile.email);
    setBirthDate(toDateInputValue(userProfile.birthDate));
    setBio(userProfile.bio ?? "");
    setFavoriteGenre(userProfile.favoriteGenre ?? "");
    setSocialLinks({
      telegram: userProfile.socialLinks?.telegram ?? "",
      discord: userProfile.socialLinks?.discord ?? "",
      vk: userProfile.socialLinks?.vk ?? "",
    });
    setErrors({});
    setTouched({});
  }, [userProfile._id, userProfile.username, userProfile.email, userProfile.birthDate, userProfile.bio, userProfile.favoriteGenre, userProfile.socialLinks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    setErrors({ username: usernameError ?? undefined, email: emailError ?? undefined });
    setTouched({ username: true, email: true });
    if (usernameError || emailError) return;

    const cleanedSocialLinks: SocialLinks = {};
    if (socialLinks.telegram?.trim()) cleanedSocialLinks.telegram = socialLinks.telegram.trim().replace(/^@/, "");
    if (socialLinks.discord?.trim()) cleanedSocialLinks.discord = socialLinks.discord.trim();
    if (socialLinks.vk?.trim()) cleanedSocialLinks.vk = socialLinks.vk.trim();

    await onSave({
      username: username.trim(),
      email: email.trim(),
      birthDate: birthDate.trim() || undefined,
      bio: bio.trim() || undefined,
      favoriteGenre: favoriteGenre || undefined,
      socialLinks: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : undefined,
    });
  };

  const showUsernameError = touched.username && errors.username;
  const showEmailError = touched.email && errors.email;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-[var(--muted-foreground)]">
        Настройте свой профиль. Аватар меняется кнопкой на аватаре.
      </p>

      <div className="space-y-2">
        <label
          htmlFor="profile-username"
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          Имя пользователя
        </label>
        <Input
          id="profile-username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, username: true }))}
          className="!space-y-0"
          placeholder="Введите имя"
          icon={User}
          error={showUsernameError ? errors.username ?? null : null}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="profile-email"
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          Email
        </label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, email: true }))}
          className="!space-y-0"
          placeholder="email@example.com"
          icon={Mail}
          error={showEmailError ? errors.email ?? null : null}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="profile-birthDate"
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          Дата рождения
        </label>
        <Input
          id="profile-birthDate"
          type="date"
          value={birthDate}
          onChange={e => setBirthDate(e.target.value)}
          className="!space-y-0"
          placeholder=""
          icon={Calendar}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="profile-bio"
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          О себе
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-[var(--muted-foreground)]" />
          <textarea
            id="profile-bio"
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 200))}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] resize-none min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Расскажите немного о себе..."
            maxLength={200}
            disabled={isLoading}
          />
          <span className="absolute right-3 bottom-2 text-xs text-[var(--muted-foreground)]">
            {bio.length}/200
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="profile-favoriteGenre"
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          Любимый жанр
        </label>
        <div className="relative">
          <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <select
            id="profile-favoriteGenre"
            value={favoriteGenre}
            onChange={e => setFavoriteGenre(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
            disabled={isLoading}
          >
            <option value="">Не выбрано</option>
            {GENRES.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[var(--border)]/60">
        <p className="text-sm font-medium text-[var(--foreground)] pt-2">Контакты</p>
        
        <div className="space-y-2">
          <label
            htmlFor="profile-telegram"
            className="block text-xs text-[var(--muted-foreground)]"
          >
            Telegram
          </label>
          <Input
            id="profile-telegram"
            value={socialLinks.telegram ?? ""}
            onChange={e => setSocialLinks(prev => ({ ...prev, telegram: e.target.value }))}
            className="!space-y-0"
            placeholder="@username или username"
            icon={MessageCircle}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="profile-discord"
            className="block text-xs text-[var(--muted-foreground)]"
          >
            Discord
          </label>
          <Input
            id="profile-discord"
            value={socialLinks.discord ?? ""}
            onChange={e => setSocialLinks(prev => ({ ...prev, discord: e.target.value }))}
            className="!space-y-0"
            placeholder="username или username#1234"
            icon={AtSign}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="profile-vk"
            className="block text-xs text-[var(--muted-foreground)]"
          >
            VK
          </label>
          <Input
            id="profile-vk"
            value={socialLinks.vk ?? ""}
            onChange={e => setSocialLinks(prev => ({ ...prev, vk: e.target.value }))}
            className="!space-y-0"
            placeholder="id или короткое имя"
            icon={User}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-xl"
          disabled={isLoading}
        >
          Отмена
        </Button>
        <Button type="submit" className="flex-1 rounded-xl" disabled={isLoading}>
          {isLoading ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
