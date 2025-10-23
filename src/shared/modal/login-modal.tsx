"use client";
import { useState, useEffect } from "react";
import { Mail, Lock } from "lucide-react";
import { authApi } from "../../api/auth";
import { LoginForm, FormErrors, FormTouched } from "../../types/form";
import { useModal } from "../../hooks/useModal";
import { Input, Modal } from "..";
import { AuthResponse } from "@/types/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onAuthSuccess: (authResponse: AuthResponse) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  onAuthSuccess,
}) => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<FormTouched<LoginForm>>({
    email: false,
    password: false,
  });

  const modalRef = useModal(isOpen, onClose);

  const validate = {
    email: (email: string): string | null => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) return "Email обязателен";
      if (!emailRegex.test(email)) return "Неверный формат email";
      return null;
    },
    password: (password: string): string | null => {
      if (!password) return "Пароль обязателен";
      return null;
    },
  };

  const errors: FormErrors<LoginForm> = {
    email: touched.email ? validate.email(form.email) : null,
    password: touched.password ? validate.password(form.password) : null,
  };

  const isFormValid = (): boolean =>
    !errors.email && !errors.password && !!form.email && !!form.password;

  const handleChange =
    (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
    };

  const handleBlur = (field: keyof LoginForm) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      const response = await authApi.login({
        email: form.email,
        password: form.password,
      });
      onAuthSuccess(response);
    } catch (error) {
      console.error("Ошибка входа:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setForm({ email: "", password: "" });
      setTouched({ email: false, password: false });
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Вход в аккаунт">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          icon={Mail}
          type="email"
          placeholder="email@domen.ru"
          value={form.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          error={errors.email}
          required
        />

        <Input
          icon={Lock}
          type={showPassword ? "text" : "password"}
          placeholder="Введите пароль"
          value={form.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          error={errors.password}
          showPasswordToggle
          isPasswordVisible={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
        />

        <button
          type="submit"
          disabled={!isFormValid() || isLoading}
          className="w-full py-3 bg-[var(--chart-1)]/90 text-white rounded-lg font-medium hover:bg-[var(--chart-1)] transition-colors disabled:opacity-50 disabled:bg-[var(--muted)]"
        >
          {isLoading ? "Загрузка..." : "Войти"}
        </button>
      </form>

      <div className="p-6 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Ещё нет аккаунта?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[var(--primary)] hover:underline font-medium"
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </Modal>
  );
};

export default LoginModal;
