import { UserProfile } from "@/types/user";
import { Lock, Shield } from "lucide-react";
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

      toast.success("Пароль успешно изменён");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { message?: string } })?.data?.message || "Ошибка при изменении пароля";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="glass rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
            Безопасность
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm">
            Смена пароля аккаунта
          </p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="rounded-xl bg-[var(--background)]/50 border border-[var(--border)]/50 p-4 space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-semibold text-[var(--foreground)] mb-1.5"
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
              className="block text-sm font-semibold text-[var(--foreground)] mb-1.5"
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
              className="block text-sm font-semibold text-[var(--foreground)] mb-1.5"
            >
              Подтверждение пароля
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Повторите новый пароль"
              icon={Lock}
              showPasswordToggle={true}
              isPasswordVisible={isConfirmPasswordVisible}
              onTogglePassword={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl font-medium shadow-md min-w-[160px]"
          >
            {isLoading ? "Сохранение…" : "Изменить пароль"}
          </Button>
        </div>
      </form>
    </div>
  );
}
