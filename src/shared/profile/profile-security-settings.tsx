import { UserProfile } from "@/types/user";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/shared/ui/button";
import Input from "@/shared/ui/input";
import { useState } from "react";

interface ProfileSecuritySettingsProps {
  userProfile: UserProfile;
}

export default function ProfileSecuritySettings({ userProfile }: ProfileSecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // TODO: Реализовать логику сохранения настроек безопасности
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      console.error("Пароли не совпадают");
      return;
    }
    
    console.log("Изменение пароля пользователя");
    // Здесь будет логика изменения пароля
    
    // Очистка формы после успешного изменения
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">
          Безопасность
        </h2>
      </div>
      
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Текущий пароль
          </label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Введите текущий пароль"
            icon={Lock}
          />
        </div>
        
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Новый пароль
          </label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Введите новый пароль"
            icon={Lock}
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Подтвердите новый пароль
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Подтвердите новый пароль"
            icon={Lock}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto">
            Изменить пароль
          </Button>
        </div>
      </form>
    </div>
  );
}