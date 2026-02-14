import { useState } from "react";
import { UserProfile } from "@/types/user";
import { Button } from "@/shared/ui/button";
import Input from "@/shared/ui/input";
import { Calendar, Mail, User } from "lucide-react";

interface ProfileEditFormProps {
  userProfile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ userProfile, onSave, onCancel }: ProfileEditFormProps) {
  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email);
  const [birthDate, setBirthDate] = useState(userProfile.birthDate || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      username,
      email,
      birthDate: birthDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-[var(--muted-foreground)]">
        Измените имя, email и дату рождения. Аватар меняется кнопкой на аватаре в сайдбаре.
      </p>

      <div className="space-y-2">
        <label htmlFor="profile-username" className="block text-sm font-medium text-[var(--foreground)]">
          Имя пользователя
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          <Input
            id="profile-username"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            className="pl-10"
            placeholder="Введите имя"
            icon={User}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-email" className="block text-sm font-medium text-[var(--foreground)]">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="email@example.com"
            icon={Mail}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-birthDate" className="block text-sm font-medium text-[var(--foreground)]">
          Дата рождения
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          <Input
            id="profile-birthDate"
            type="date"
            value={birthDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBirthDate(e.target.value)}
            className="pl-10"
            onBlur={() => {}}
            error={null}
            placeholder=""
            icon={Calendar}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">
          Отмена
        </Button>
        <Button type="submit" className="flex-1 rounded-xl">
          Сохранить
        </Button>
      </div>
    </form>
  );
}
