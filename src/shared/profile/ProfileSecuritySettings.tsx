import { UserProfile } from "@/types/user";
import { Lock, Shield, HelpCircle } from "lucide-react";
import { Button } from "@/shared/ui/button";
import Input from "@/shared/ui/input";
import { useState } from "react";
import { useChangePasswordMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import Tooltip from "@/shared/ui/Tooltip";

interface ProfileSecuritySettingsProps {
  userProfile: UserProfile;
  /** Встроенный вид: без карточки, только форма */
  embedded?: boolean;
}

export default function ProfileSecuritySettings({
  userProfile: _userProfile,
  embedded,
}: ProfileSecuritySettingsProps) {
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

  const form = (
    <form onSubmit={handleChangePassword} className="space-y-3">
        <div className="rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]/60 p-3 space-y-3">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-xs font-semibold text-[var(--foreground)] mb-1"
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
              className="block text-xs font-semibold text-[var(--foreground)] mb-1"
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
              className="block text-xs font-semibold text-[var(--foreground)] mb-1"
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
            className="px-4 py-2 rounded-xl font-medium text-sm min-w-[140px]"
          >
            {isLoading ? "Сохранение…" : "Изменить пароль"}
          </Button>
        </div>
      </form>
  );

  if (embedded) return form;

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-4 shadow-sm max-w-md">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]/60">
            <Shield className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Безопасность</h2>
            <p className="text-[var(--muted-foreground)] text-xs">Смена пароля аккаунта</p>
          </div>
        </div>
        <Tooltip
          content={
            <div className="space-y-2 max-w-[280px]">
              <p className="font-medium">Смена пароля</p>
              <p>Для смены пароля введите текущий пароль и новый пароль дважды.</p>
              <p className="text-[var(--muted-foreground)]">
                Рекомендуем использовать пароль длиной не менее 8 символов, содержащий буквы, цифры
                и специальные символы.
              </p>
            </div>
          }
          position="left"
          trigger="click"
        >
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
      {form}
    </div>
  );
}
