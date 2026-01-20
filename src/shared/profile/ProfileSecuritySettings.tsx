import { UserProfile } from "@/types/user";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/shared/ui/button";
import Input from "@/shared/ui/input";
import { useState } from "react";
import { useChangePasswordMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

interface ProfileSecuritySettingsProps {
  userProfile: UserProfile;
}

export default function ProfileSecuritySettings({}: ProfileSecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const toast = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      toast.success("Пароль успешно изменен");

      // Очистка формы после успешного изменения
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Ошибка при изменении пароля");
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Безопасность</h2>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-2">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-[var(--muted-foreground)] mb-1"
          >
            Текущий пароль
          </label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Введите текущий пароль"
            icon={Lock}
            showPasswordToggle={true}
            isPasswordVisible={isCurrentPasswordVisible}
            onTogglePassword={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-[var(--muted-foreground)] mb-1"
          >
            Новый пароль
          </label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Введите новый пароль"
            icon={Lock}
            showPasswordToggle={true}
            isPasswordVisible={isNewPasswordVisible}
            onTogglePassword={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-[var(--muted-foreground)] mb-1"
          >
            Подтвердите новый пароль
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Подтвердите новый пароль"
            icon={Lock}
            showPasswordToggle={true}
            isPasswordVisible={isConfirmPasswordVisible}
            onTogglePassword={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
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
