"use client";
import { useState, useEffect } from "react";
import { Mail, Lock } from "lucide-react";
import { useLoginMutation } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm, FormErrors, FormTouched } from "../../types/form";
import { useModal } from "../../hooks/useModal";
import { Input, Modal } from "..";
import { AuthResponse } from "@/types/auth";

// Типы для обработки ошибок RTK Query
interface ServerError {
  message: string;
}

interface SerializedError {
  message?: string;
  code?: string;
  name?: string;
}

interface FetchBaseQueryError {
  status: number;
  data?: unknown;
}

type RTKQueryError = FetchBaseQueryError | SerializedError | undefined;

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
  const [touched, setTouched] = useState<FormTouched<LoginForm>>({
    email: false,
    password: false,
  });

  // Используем RTK Query для логина
  const [loginMutation, { isLoading, error }] = useLoginMutation();
  const { login: authLogin } = useAuth();

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

  // Безопасное извлечение сообщения об ошибке
  const getErrorMessage = (): string | null => {
    if (!error) return null;

    // Проверяем тип ошибки и извлекаем сообщение безопасно
    if (typeof error === "object") {
      // Ошибка с данными от сервера (FetchBaseQueryError)
      if ("data" in error && error.data && typeof error.data === "object") {
        const serverError = error.data as ServerError;
        return serverError.message || "Произошла ошибка при входе";
      }

      // Сериализованная ошибка (SerializedError)
      if ("message" in error && error.message) {
        return error.message;
      }

      // Ошибка с статусом (сетевая ошибка)
      if ("status" in error) {
        switch (error.status) {
          case 404:
            return "Сервер не найден или endpoint недоступен";
          case 401:
            return "Неверные учетные данные";
          case 500:
            return "Ошибка на сервере";
          default:
            return "Ошибка соединения с сервером";
        }
      }
    }

    // Строковая ошибка
    if (typeof error === "string") {
      return error;
    }

    return "Произошла неизвестная ошибка";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isFormValid()) return;

    try {
      // Используем RTK Query мутацию для логина
      const response = await loginMutation({
        email: form.email,
        password: form.password,
      }).unwrap();

      // Сохраняем в Redux store и localStorage через useAuth хук
      authLogin(response);

      // Вызываем колбэк успешной авторизации
      onAuthSuccess(response);
    } catch (err) {
      // Ошибка уже обработана в RTK Query
      console.error("Ошибка входа:", err);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setForm({ email: "", password: "" });
      setTouched({ email: false, password: false });
    }
  }, [isOpen]);

  const errorMessage = getErrorMessage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Вход в аккаунт">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Показываем ошибку от сервера */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{errorMessage}</p>
          </div>
        )}

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
