"use client";
import { useState, useEffect } from "react";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useRegisterMutation } from "@/store/api/authApi";
import { RegisterData, FormErrors, FormTouched } from "../../types/form";
import { Modal } from "..";
import termsOfUse from "@/constants/terms-of-use";
import { AuthResponse } from "@/types/auth";
import { ApiResponseDto } from "@/types/api";
import { MESSAGES } from "@/constants/messages";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
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

  const isFormValid = (): boolean => {
    const baseValid =
      !Object.values(errors).some(error => error) &&
      !!form.email &&
      !!form.password &&
      !!form.username &&
      !!form.confirmPassword;
    if (TURNSTILE_SITE_KEY) {
      return baseValid && !!captchaToken;
    }
    return baseValid;
  };

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
        ...(captchaToken && { captchaToken }),
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
      setCaptchaToken(null);
    }
  }, [isOpen]);

  const apiErrorMessage =
    apiError && typeof apiError === "object" && apiError !== null && "data" in apiError
      ? (apiError.data as { message?: string })?.message || "Ошибка регистрации"
      : null;

  const inputBase =
    "w-full pl-10 pr-4 py-3 rounded-xl border bg-[var(--secondary)] placeholder:text-[var(--muted-foreground)]/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/30 focus:border-[var(--chart-1)]";
  const inputError = "border-red-500 focus:ring-red-500/20";
  const inputNormal = "border-[var(--border)] hover:border-[var(--muted-foreground)]/50";
  const inputRightPadding = "pr-11";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={MESSAGES.UI_ELEMENTS.REGISTER_TITLE}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {MESSAGES.UI_ELEMENTS.REGISTER_SUBTITLE}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {apiErrorMessage && (
            <div
              className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-fadeIn"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{apiErrorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm font-medium text-[var(--foreground)]">
              Имя
            </label>
            <div className="relative">
              <User
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  errors.username ? "text-red-500" : "text-[var(--muted-foreground)]"
                }`}
              />
              <input
                id="username"
                type="text"
                placeholder={MESSAGES.UI_ELEMENTS.USERNAME_PLACEHOLDER}
                value={form.username}
                onChange={handleChange("username")}
                onBlur={handleBlur("username")}
                className={`${inputBase} ${errors.username ? inputError : inputNormal}`}
                required
                name="username"
                disabled={isLoading}
                autoComplete="username"
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? "username-error" : undefined}
              />
            </div>
            {errors.username && (
              <p id="username-error" className="text-xs text-red-500 flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.username}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email-register" className="block text-sm font-medium text-[var(--foreground)]">
              Email
            </label>
            <div className="relative">
              <Mail
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  errors.email ? "text-red-500" : "text-[var(--muted-foreground)]"
                }`}
              />
              <input
                id="email-register"
                type="email"
                placeholder={MESSAGES.UI_ELEMENTS.EMAIL_PLACEHOLDER}
                value={form.email}
                onChange={handleChange("email")}
                onBlur={handleBlur("email")}
                className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                required
                name="email"
                disabled={isLoading}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-register-error" : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-register-error" className="text-xs text-red-500 flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password-register" className="block text-sm font-medium text-[var(--foreground)]">
              Пароль
            </label>
            <div className="relative">
              <Lock
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  errors.password ? "text-red-500" : "text-[var(--muted-foreground)]"
                }`}
              />
              <input
                id="password-register"
                type={showPassword ? "text" : "password"}
                placeholder={MESSAGES.UI_ELEMENTS.PASSWORD_PLACEHOLDER}
                value={form.password}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
                className={`${inputBase} ${inputRightPadding} ${errors.password ? inputError : inputNormal}`}
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/20"
                disabled={isLoading}
                aria-label={showPassword ? MESSAGES.UI_ELEMENTS.HIDE_PASSWORD : MESSAGES.UI_ELEMENTS.SHOW_PASSWORD}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-register-error" className="text-xs text-red-500 flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)]">
              Подтверждение пароля
            </label>
            <div className="relative">
              <Lock
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  errors.confirmPassword ? "text-red-500" : "text-[var(--muted-foreground)]"
                }`}
              />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={MESSAGES.UI_ELEMENTS.CONFIRM_PASSWORD_PLACEHOLDER}
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                onBlur={handleBlur("confirmPassword")}
                className={`${inputBase} ${inputRightPadding} ${errors.confirmPassword ? inputError : inputNormal}`}
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/20"
                disabled={isLoading}
                aria-label={showConfirmPassword ? MESSAGES.UI_ELEMENTS.HIDE_PASSWORD : MESSAGES.UI_ELEMENTS.SHOW_PASSWORD}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="text-xs text-red-500 flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {TURNSTILE_SITE_KEY && (
            <div className="flex flex-col items-center gap-1.5">
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
                options={{
                  theme: "auto",
                  language: "ru",
                  size: "normal",
                }}
              />
              {!captchaToken && touched.confirmPassword && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Подтвердите, что вы не робот
                </p>
              )}
            </div>
          )}

          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-[var(--border)] bg-[var(--secondary)] text-[var(--chart-1)] focus:ring-2 focus:ring-[var(--chart-1)]/30 focus:ring-offset-2"
              required
            />
            <label htmlFor="terms" className="text-sm text-[var(--foreground)] leading-relaxed cursor-pointer">
              {MESSAGES.UI_ELEMENTS.TERMS_LABEL}{" "}
              <button
                type="button"
                className="text-[var(--chart-1)] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/30 focus:ring-offset-2 rounded px-0.5 -mx-0.5"
                onClick={() => setShowTermsModal(true)}
              >
                {MESSAGES.UI_ELEMENTS.TERMS_LINK}
              </button>
            </label>
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-[var(--chart-1)] hover:opacity-95 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-[var(--chart-1)]/25 focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/50 focus:ring-offset-2 focus:ring-offset-[var(--background)]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {MESSAGES.UI_ELEMENTS.LOADING}
              </span>
            ) : (
              MESSAGES.UI_ELEMENTS.SUBMIT_REGISTER
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {MESSAGES.UI_ELEMENTS.HAVE_ACCOUNT}{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[var(--chart-1)] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/30 focus:ring-offset-2 focus:ring-offset-[var(--background)] rounded px-1 -mx-1"
              disabled={isLoading}
            >
              {MESSAGES.UI_ELEMENTS.LOGIN}
            </button>
          </p>
        </div>
      </div>

      {/* Модальное окно с условиями использования */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Условия использования"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          <div className="prose prose-sm max-w-none text-[var(--muted-foreground)]">
            <h3 className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2 first:mt-0">
              Общие положения
            </h3>
            <p className="mb-4 text-sm leading-relaxed">{termsOfUse.ru.sections.general.content}</p>

            <h3 className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2">
              Термины и определения
            </h3>
            <ul className="list-disc list-inside mb-4 space-y-1.5 text-sm">
              {termsOfUse.ru.sections.definitions.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2">
              Предмет соглашения
            </h3>
            <ul className="list-disc list-inside mb-4 space-y-1.5 text-sm">
              {termsOfUse.ru.sections.agreement.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2">
              Права и обязанности Пользователя
            </h3>
            <ul className="list-disc list-inside mb-4 space-y-1.5 text-sm">
              {termsOfUse.ru.sections.userRights.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2">
              Права и обязанности Администрации
            </h3>
            <ul className="list-disc list-inside mb-4 space-y-1.5 text-sm">
              {termsOfUse.ru.sections.adminRights.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2">
              Интеллектуальная собственность
            </h3>
            <ul className="list-disc list-inside mb-4 space-y-1.5 text-sm">
              {termsOfUse.ru.sections.intellectualProperty.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2">
              Ограничение ответственности
            </h3>
            <ul className="list-disc list-inside mb-4 space-y-1.5 text-sm">
              {termsOfUse.ru.sections.liability.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2">
              Прочие условия
            </h3>
            <ul className="list-disc list-inside mb-4 space-y-1.5 text-sm">
              {termsOfUse.ru.sections.other.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default RegisterModal;
