"use client";
import { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLoginMutation } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm, FormErrors, FormTouched } from "../../types/form";
import { Input, Modal } from "..";
import { AuthResponse, ApiResponseDto } from "@/types/auth";

// Типы для обработки ошибок RTK Query
interface ServerError {
  message: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onAuthSuccess: (authResponse: ApiResponseDto<AuthResponse>) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  onAuthSuccess,
}) => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const yandexButtonRef = useRef<HTMLDivElement>(null);
  const vkButtonRef = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState<FormTouched<LoginForm>>({
    email: false,
    password: false,
  });

  // Используем RTK Query для логина
  const [loginMutation, { isLoading, error }] = useLoginMutation();
  const { login: authLogin } = useAuth();

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

  // Инициализация виджета Яндекс авторизации
  useEffect(() => {
    if (isOpen && yandexButtonRef.current) {
      // Очищаем контейнер перед инициализацией
      yandexButtonRef.current.innerHTML = "";

      // Проверяем, что YaAuthSuggest доступен
      if (typeof window !== "undefined" && window.YaAuthSuggest) {
        const tokenPageOrigin = window.location.origin;

        window.YaAuthSuggest.init(
          {
            client_id: "ffd24e1c16544069bc7a1e8c66316f37",
            response_type: "token",
            redirect_uri: "https://tomilo-lib.ru/auth/yandex",
          },
          tokenPageOrigin,
          {
            view: "button",
            parentId: "yandexButtonContainer",
            buttonSize: "m",
            buttonView: "main",
            buttonTheme: "light",
            buttonBorderRadius: "22",
            buttonIcon: "ya",
          }
        )
          .then(({ handler }) => handler())
          .then((data: unknown) => {
            // Явно типизируем data как объект с нужными полями
            const tokenData = data as {
              access_token: string;
              expires_in: string;
            };
            console.log("Сообщение с токеном", tokenData);
            // Здесь будет обработка токена авторизации
          })
          .catch((error: { error: string; error_description: string }) => {
            console.log("Обработка ошибки", error);
          });
      }
    }
  }, [isOpen]);

  // Инициализация виджета VK авторизации
  useEffect(() => {
    if (isOpen && vkButtonRef.current) {
      // Очищаем контейнер перед инициализацией
      vkButtonRef.current.innerHTML = "";

      // Проверяем, что VKIDSDK доступен
      if (typeof window !== "undefined" && window.VKIDSDK) {
        const VKID = window.VKIDSDK;

        try {
          // Инициализация конфигурации
          VKID.Config.init({
            app: 54369328,
            redirectUrl: "https://tomilo-lib.ru/auth/vk",
            responseMode: VKID.Config.ResponseMode.Callback,
            source: VKID.Config.Source.LOWCODE,
            scope: "",
          });

          // Создаем контейнер для кнопки
          const container = document.createElement("div");
          container.id = "vkButtonContainer";
          vkButtonRef.current.appendChild(container);

          // Создаем виджет OneTap
          const oneTap = new VKID.OneTap();

          oneTap
            .render({
              container: "#vkButtonContainer",
              showAlternativeLogin: true,
              styles: {
                borderRadius: 50,
              },
            })
            .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
              console.log("Ошибка VK авторизации", error);
            })
            .on(
              VKID.OneTapInternalEvents.LOGIN_SUCCESS,
              function (payload: unknown) {
                const typedPayload = payload as {
                  code: string;
                  device_id: string;
                };
                const code = typedPayload.code;
                const deviceId = typedPayload.device_id;

                VKID.Auth.exchangeCode(code, deviceId)
                  .then((data: unknown) => {
                    console.log("Успешная авторизация через VK", data);
                    // Здесь будет обработка токена авторизации
                  })
                  .catch((error: unknown) => {
                    console.log("Ошибка обмена кода VK", error);
                  });
              }
            );
        } catch (error) {
          console.log("Ошибка инициализации VKID", error);
        }
      } 
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setForm({ email: "", password: "" });
      setTouched({ email: false, password: false });
      setShowPassword(false);
    }
  }, [isOpen]);

  const errorMessage = getErrorMessage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Вход в аккаунт">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Показываем ошибку от сервера */}
        {errorMessage && (
          <div
            className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-red-700 text-sm text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              {errorMessage}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
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
              id="email"
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
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p
              id="email-error"
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Пароль
            </label>
            <button
              type="button"
              disabled
              className="text-xs text-[var(--primary)] hover:underline"
              onClick={() => console.log("Запрос на восстановление пароля")}
            >
              Забыли пароль?
            </button>
          </div>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                errors.password
                  ? "text-red-500"
                  : "text-[var(--muted-foreground)]"
              }`}
            />
            <input
              id="password"
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
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              disabled={isLoading}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="password-error"
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.password}
            </p>
          )}
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
            "Войти"
          )}
        </button>
      </form>

      {/* Разделитель */}
      <div className="px-6 py-2 flex items-center">
        <div className="flex-grow border-t border-[var(--border)]"></div>
        <span className="flex-shrink mx-4 text-xs text-[var(--muted-foreground)]">
          или
        </span>
        <div className="flex-grow border-t border-[var(--border)]"></div>
      </div>

      {/* Контейнеры для кнопок авторизации */}
      <div className="px-6 py-2 space-y-3 relative">
        <div ref={yandexButtonRef} id="yandexButtonContainer" className="flex justify-center"></div>
        <div ref={vkButtonRef} className="flex justify-center" />
      </div>

      <div className="p-6 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Ещё нет аккаунта?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="cursor-pointer text-[var(--primary)] hover:underline font-medium disabled:opacity-50 transition-colors"
            // disabled={isLoading}
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </Modal>
  );
};

export default LoginModal;
