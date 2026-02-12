"use client";
import { useState, useEffect } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useRegisterMutation } from "@/store/api/authApi";
import { RegisterData, FormErrors, FormTouched } from "../../types/form";
import { Modal } from "..";
import termsOfUse from "@/constants/terms-of-use";
import { AuthResponse } from "@/types/auth";
import { ApiResponseDto } from "@/types/api";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onAuthSuccess: (authResponse: ApiResponseDto<AuthResponse>) => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onAuthSuccess,
}) => {
  const [form, setForm] = useState<RegisterData>({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [touched, setTouched] = useState<FormTouched<RegisterData>>({
    email: false,
    password: false,
    username: false,
    confirmPassword: false,
  });

  // Используем хук мутации из RTK Query
  const [register, { isLoading, error: apiError }] = useRegisterMutation();

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

  const errors: FormErrors<RegisterData> = {
    email: touched.email ? validate.email(form.email) : null,
    password: touched.password ? validate.password(form.password) : null,
    username: touched.username ? validate.username(form.username) : null,
    confirmPassword: touched.confirmPassword
      ? validate.confirmPassword(form.confirmPassword)
      : null,
  };

  const isFormValid = (): boolean =>
    !Object.values(errors).some(error => error) &&
    !!form.email &&
    !!form.password &&
    !!form.username &&
    !!form.confirmPassword;

  const handleChange = (field: keyof RegisterData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof RegisterData) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
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
        confirmPassword: form.confirmPassword,
      }).unwrap();

      // Отправляем приветственное письмо после успешной регистрации
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/send-verification-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: form.email }),
          },
        );
      } catch (emailError) {
        console.error("Ошибка отправки приветственного письма:", emailError);
        // Не прерываем основной процесс регистрации из-за ошибки отправки письма
      }

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
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создание аккаунта">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Показываем ошибку API если есть */}
        {apiError && (
          <div
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fadeIn"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-red-600 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              {"data" in apiError
                ? (apiError.data as { message?: string })?.message || "Ошибка регистрации"
                : "Ошибка регистрации"}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-[var(--foreground)]">
            Имя пользователя
          </label>
          <div className="relative">
            <User
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                errors.username ? "text-red-500" : "text-[var(--muted-foreground)]"
              }`}
            />
            <input
              id="username"
              type="text"
              placeholder="Введите ваше имя"
              value={form.username}
              onChange={handleChange("username")}
              onBlur={handleBlur("username")}
              className={`w-full pl-10 pr-4 py-2 bg-[var(--secondary)] border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.username
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-[var(--border)] hover:border-[var(--border-hover)] focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              }`}
              required
              name="username"
              disabled={isLoading}
              autoComplete="username"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
          </div>
          {errors.username && (
            <p id="username-error" className="text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.username}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email-register"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Email
          </label>
          <div className="relative">
            <Mail
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                errors.email ? "text-red-500" : "text-[var(--muted-foreground)]"
              }`}
            />
            <input
              id="email-register"
              type="email"
              placeholder="email@domen.ru"
              value={form.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              className={`w-full pl-10 pr-4 py-2 bg-[var(--secondary)] border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.email
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-[var(--border)] hover:border-[var(--border-hover)] focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              }`}
              required
              name="email"
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-register-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="email-register-error" className="text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password-register"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Пароль
          </label>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                errors.password ? "text-red-500" : "text-[var(--muted-foreground)]"
              }`}
            />
            <input
              id="password-register"
              type={showPassword ? "text" : "password"}
              placeholder="Введите пароль"
              value={form.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              className={`w-full pl-10 pr-10 py-2 bg-[var(--secondary)] border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.password
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-[var(--border)] hover:border-[var(--border-hover)] focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              }`}
              required
              name="password"
              disabled={isLoading}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-register-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              disabled={isLoading}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p
              id="password-register-error"
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Подтверждение пароля
          </label>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                errors.confirmPassword ? "text-red-500" : "text-[var(--muted-foreground)]"
              }`}
            />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Повторите пароль"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              className={`w-full pl-10 pr-10 py-2 bg-[var(--secondary)] border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-[var(--border)] hover:border-[var(--border-hover)] focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              }`}
              required
              name="confirmPassword"
              disabled={isLoading}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              disabled={isLoading}
              aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            type="checkbox"
            className="w-4 h-4 text-[var(--primary)] bg-[var(--secondary)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
            required
          />
          <label htmlFor="terms" className="ml-2 text-sm text-[var(--foreground)]">
            Я согласен с{" "}
            <button
              type="button"
              className="text-[var(--chart-1)] hover:underline "
              onClick={() => setShowTermsModal(true)}
            >
              условиями использования
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={!isFormValid() || isLoading}
          className="w-full py-3 bg-[var(--chart-1)]/90 text-white rounded-lg font-medium hover:bg-[var(--chart-1)] transition-all duration-300 disabled:opacity-50 disabled:bg-[var(--muted)] disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Загрузка...
            </span>
          ) : (
            "Зарегистрироваться"
          )}
        </button>
      </form>

      <div className="p-6 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Уже есть аккаунт?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[var(--primary)] hover:underline font-medium disabled:opacity-50 transition-colors"
            disabled={isLoading}
          >
            Войти
          </button>
        </p>
      </div>

      {/* Модальное окно с условиями использования */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Условия использования"
      >
        <div className="prose prose-sm max-w-none text-[var(--muted-foreground)]">
          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-2">
            Общие положения
          </h3>
          <p className="mb-4">{termsOfUse.ru.sections.general.content}</p>

          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-2">
            Термины и определения
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {termsOfUse.ru.sections.definitions.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-2">
            Предмет соглашения
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {termsOfUse.ru.sections.agreement.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-2">
            Права и обязанности Пользователя
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {termsOfUse.ru.sections.userRights.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-2">
            Права и обязанности Администрации
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {termsOfUse.ru.sections.adminRights.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-2">
            Интеллектуальная собственность
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {termsOfUse.ru.sections.intellectualProperty.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-2">
            Ограничение ответственности
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {termsOfUse.ru.sections.liability.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-2">
            Прочие условия
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {termsOfUse.ru.sections.other.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </Modal>
    </Modal>
  );
};

export default RegisterModal;
