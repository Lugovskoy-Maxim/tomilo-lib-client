"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/types/user";
import { Button } from "@/shared/ui/button";
import Input from "@/shared/ui/input";
import { Calendar, Mail, User } from "lucide-react";

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

export default function ProfileEditForm({
  userProfile,
  onSave,
  onCancel,
  isLoading = false,
}: ProfileEditFormProps) {
  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email);
  const [birthDate, setBirthDate] = useState(userProfile.birthDate || "");
  const [errors, setErrors] = useState<{ username?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ username?: boolean; email?: boolean }>({});

  // Синхронизация с актуальным профилем при открытии модалки
  useEffect(() => {
    setUsername(userProfile.username);
    setEmail(userProfile.email);
    setBirthDate(userProfile.birthDate || "");
    setErrors({});
    setTouched({});
  }, [userProfile._id, userProfile.username, userProfile.email, userProfile.birthDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    setErrors({ username: usernameError ?? undefined, email: emailError ?? undefined });
    setTouched({ username: true, email: true });
    if (usernameError || emailError) return;

    await onSave({
      username: username.trim(),
      email: email.trim(),
      birthDate: birthDate.trim() || undefined,
    });
  };

  const showUsernameError = touched.username && errors.username;
  const showEmailError = touched.email && errors.email;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-[var(--muted-foreground)]">
        Измените отображаемое имя и email. Аватар меняется кнопкой на аватаре в сайдбаре слева.
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
