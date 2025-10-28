"use client";
import { useState, useEffect } from "react";
import { Mail, Lock, User } from "lucide-react";
import { useRegisterMutation } from "@/store/api/authApi";
import { RegisterForm, FormErrors, FormTouched } from "../../types/form";
import { useModal } from "../../hooks/useModal";
import { Input, Modal } from "..";
import { AuthResponse } from "@/types/auth";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onAuthSuccess: (authResponse: AuthResponse) => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onAuthSuccess,
}) => {
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<FormTouched<RegisterForm>>({
    email: false,
    password: false,
    username: false,
    confirmPassword: false,
  });
  
  // Используем хук мутации из RTK Query
  const [register, { isLoading, error: apiError }] = useRegisterMutation();
  
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
      if (password.length < 6) return "Минимум 6 символов";
      return null;
    },
    username: (username: string): string | null => {
      if (!username) return "Имя обязательно";
      if (username.length < 3) return "Минимум 3 символа";
      return null;
    },
    confirmPassword: (confirm: string): string | null => {
      if (confirm !== form.password) return "Пароли не совпадают";
      return null;
    },
  };

  const errors: FormErrors<RegisterForm> = {
    email: touched.email ? validate.email(form.email) : null,
    password: touched.password ? validate.password(form.password) : null,
    username: touched.username ? validate.username(form.username) : null,
    confirmPassword: touched.confirmPassword
      ? validate.confirmPassword(form.confirmPassword)
      : null,
  };

  const isFormValid = (): boolean =>
    !Object.values(errors).some((error) => error) &&
    !!form.email &&
    !!form.password &&
    !!form.username &&
    !!form.confirmPassword;

  const handleChange =
    (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
    };

  const handleBlur = (field: keyof RegisterForm) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      email: true,
      password: true,
      username: true,
      confirmPassword: true,
    });
    if (!isFormValid()) return;

    try {
      // Вызываем мутацию и разворачиваем результат
      const response = await register({
        email: form.email,
        password: form.password,
        username: form.username,
      }).unwrap(); // unwrap() для получения данных или ошибки
      
      // Передаем данные в родительский компонент
      onAuthSuccess(response);
    } catch (error) {
      // Ошибка уже будет в apiError, но можно обработать и здесь
      console.error("Ошибка регистрации:", error);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setForm({ email: "", password: "", username: "", confirmPassword: "" });
      setTouched({
        email: false,
        password: false,
        username: false,
        confirmPassword: false,
      });
      setShowPassword(false);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создание аккаунта">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Показываем ошибку API если есть */}
        {apiError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-600 text-sm">
              {"data" in apiError 
                ? (apiError.data as { message?: string })?.message || "Ошибка регистрации"
                : "Ошибка регистрации"
              }
            </p>
          </div>
        )}

        <Input
          icon={User}
          type="text"
          placeholder="Введите ваше имя"
          value={form.username}
          onChange={handleChange("username")}
          onBlur={handleBlur("username")}
          error={errors.username}
          required
          name="username"
          disabled={isLoading}
        />

        <Input
          icon={Mail}
          type="email"
          placeholder="email@domen.ru"
          value={form.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          error={errors.email}
          required
          name="email"
          disabled={isLoading}
        />

        <Input
          icon={Lock}
          type="password"
          placeholder="Введите пароль"
          value={form.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          error={errors.password}
          showPasswordToggle
          isPasswordVisible={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
          name="password"
          disabled={isLoading}
        />

        <Input
          icon={Lock}
          type="password"
          placeholder="Повторите пароль"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          onBlur={handleBlur("confirmPassword")}
          error={errors.confirmPassword}
          showPasswordToggle
          isPasswordVisible={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
          name="confirmPassword"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!isFormValid() || isLoading}
          className="w-full py-3 bg-[var(--chart-1)]/90 text-white rounded-lg font-medium hover:bg-[var(--chart-1)] transition-colors disabled:opacity-50 disabled:bg-[var(--muted)] disabled:cursor-not-allowed"
        >
          {isLoading ? "Загрузка..." : "Зарегистрироваться"}
        </button>
      </form>

      <div className="p-6 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Уже есть аккаунт?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[var(--primary)] hover:underline font-medium disabled:opacity-50"
            disabled={isLoading}
          >
            Войти
          </button>
        </p>
      </div>
    </Modal>
  );
};

export default RegisterModal;