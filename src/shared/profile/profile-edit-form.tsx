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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-[var(--muted-foreground)] mb-1"
        >
          Имя пользователя
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input
            id="username"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            className="pl-10"
            placeholder="Введите имя пользователя"
            icon={User}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--muted-foreground)] mb-1"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="Введите email"
            icon={Mail}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="birthDate"
          className="block text-sm font-medium text-[var(--muted-foreground)] mb-1"
        >
          Дата рождения
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input
            type="date"
            value={birthDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBirthDate(e.target.value)}
            className="pl-10"
            icon={Calendar}
            onBlur={() => {}}
            error={null}
            placeholder=""
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">
          Сохранить
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Отмена
        </Button>
      </div>
    </form>
  );
}
