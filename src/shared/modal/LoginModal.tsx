"use client";
import { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import {
  useLoginMutation,
  useForgotPasswordMutation,
  useVkAuthWithTokenMutation,
} from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import { LoginData, FormErrors, FormTouched } from "../../types/form";
import { Modal } from "..";
import { ApiResponseDto } from "@/types/api";
import { AuthResponse } from "@/types/auth";
import { VALIDATION_MESSAGES } from "@/constants/validation";
import { MESSAGES } from "@/constants/messages";

// Официальный CDN; UMD экспортирует глобальную переменную VKID (или VKIDSDK в старых сборках)
const VK_ID_SDK_URL =
  "https://cdn.jsdelivr.net/npm/@vkid/sdk@2/dist-sdk/umd/index.js";
const VK_APP_ID = 54445438;

function getVKID(): typeof window.VKIDSDK | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { VKID?: typeof window.VKIDSDK }).VKID ?? window.VKIDSDK;
}

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
  const [form, setForm] = useState<LoginData>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<FormTouched<LoginData>>({
    email: false,
    password: false,
  });

  const [loginMutation, { isLoading, error }] = useLoginMutation();
  const [forgotPasswordMutation, { isLoading: isForgotPasswordLoading }] =
    useForgotPasswordMutation();
  const [vkAuthWithToken, { isLoading: isVkAuthLoading }] =
    useVkAuthWithTokenMutation();
  const { login: authLogin } = useAuth();
  const vkContainerRef = useRef<HTMLDivElement>(null);
  const vkOneTapInitialized = useRef(false);
  const [showVkFallback, setShowVkFallback] = useState(false);

  const validate = {
    email: (email: string): string | null => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) return VALIDATION_MESSAGES.EMAIL_REQUIRED;
      if (!emailRegex.test(email)) return VALIDATION_MESSAGES.EMAIL_INVALID;
      return null;
    },
    password: (password: string): string | null => {
      if (!password) return VALIDATION_MESSAGES.PASSWORD_REQUIRED;
      return null;
    },
  };

  const errors: FormErrors<LoginData> = {
    email: touched.email ? validate.email(form.email) : null,
    password: touched.password ? validate.password(form.password) : null,
  };

  const isFormValid = (): boolean =>
    !errors.email && !errors.password && !!form.email && !!form.password;

  const handleChange = (field: keyof LoginData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof LoginData) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Подмена типичного англоязычного сообщения от внешних сервисов (VK и др.)
  const normalizeErrorMessage = (msg: string): string => {
    if (/error loading|please try again|try again later/i.test(msg)) {
      return MESSAGES.ERROR_MESSAGES.LOAD_ERROR_TRY_AGAIN;
    }
    return msg;
  };

  // Безопасное извлечение сообщения об ошибке
  const getErrorMessage = (): string | null => {
    if (!error) return null;

    // Проверяем тип ошибки и извлекаем сообщение безопасно
    if (typeof error === "object") {
      // Ошибка с данными от сервера (FetchBaseQueryError)
      if ("data" in error && error.data && typeof error.data === "object") {
        const serverError = error.data as ServerError;
        const msg = serverError.message || MESSAGES.ERROR_MESSAGES.LOGIN_ERROR;
        return normalizeErrorMessage(msg);
      }

      // Сериализованная ошибка (SerializedError)
      if ("message" in error && error.message) {
        return normalizeErrorMessage(String(error.message));
      }

      // Ошибка с статусом (сетевая ошибка)
      if ("status" in error) {
        switch (error.status) {
          case 404:
            return MESSAGES.ERROR_MESSAGES.SERVER_NOT_FOUND;
          case 401:
            return MESSAGES.ERROR_MESSAGES.INVALID_CREDENTIALS;
          case 500:
            return MESSAGES.ERROR_MESSAGES.SERVER_ERROR;
          default:
            return MESSAGES.ERROR_MESSAGES.NETWORK_ERROR;
        }
      }
    }

    // Строковая ошибка
    if (typeof error === "string") {
      return normalizeErrorMessage(error);
    }

    return MESSAGES.ERROR_MESSAGES.UNKNOWN_ERROR;
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

  // SDK Яндекса временно отключен
  /*
  useEffect(() => {
    if (isOpen && yandexButtonRef.current) {
      // Очищаем контейнер перед инициализацией
      yandexButtonRef.current.innerHTML = "";
      setYandexSdkLoaded(false);

      // Увеличенная задержка для Safari (500ms вместо 100ms)
      const initTimer = setTimeout(async () => {
        try {
          // Пробуем загрузить SDK если он недоступен (fallback для Safari)
          if (typeof window !== "undefined" && !window.YaAuthSuggest) {
            await loadYandexSDK();
          }

          // Проверяем, что YaAuthSuggest доступен и контейнер существует
          if (typeof window !== "undefined" && window.YaAuthSuggest && yandexButtonRef.current) {
            setYandexSdkLoaded(true);
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
                buttonSize: "m",
                buttonView: "main",
                buttonTheme: "light",
                buttonBorderRadius: "22",
                buttonIcon: "ya",
              },
            )
              .then(({ handler }) => handler())
              .then(async (data: unknown) => {
                // Явно типизируем data как объект с нужными полями
                const tokenData = data as {
                  access_token: string;
                  expires_in: string;
                };
                console.log("Сообщение с токеном", tokenData);

                try {
                  // Отправляем токен на сервер для авторизации
                  const response = await yandexAuthMutation({
                    access_token: tokenData.access_token,
                  }).unwrap();

                  // Сохраняем в Redux store и localStorage через useAuth хук
                  authLogin(response);

                  // Вызываем колбэк успешной авторизации
                  onAuthSuccess(response);

                  // Закрываем модальное окно
                  onClose();
                } catch (error) {
                  console.error("Ошибка авторизации через Яндекс:", error);
                }
              })
              .catch((error: { error: string; error_description: string }) => {
                console.log("Обработка ошибки", error);
              });
          } else {
            console.warn("YaAuthSuggest не доступен после попытки загрузки SDK");
          }
        } catch (sdkError) {
          console.error("Ошибка загрузки Yandex SDK:", sdkError);
        }
      }, 500); // 500ms delay для Safari

      return () => clearTimeout(initTimer);
    }
  }, [authLogin, isOpen, onAuthSuccess, onClose, yandexAuthMutation, loadYandexSDK]);
  */

  // Проверка наличия токена в localStorage для автоматического закрытия модального окна
  useEffect(() => {
    if (!isOpen) return;

    const checkToken = () => {
      const token = localStorage.getItem("tomilo_lib_token");
      if (token) {
        // Токен появился, закрываем модальное окно
        onClose();
      }
    };

    // Проверяем токен сразу
    checkToken();

    // Устанавливаем интервал для периодической проверки
    const interval = setInterval(checkToken, 1000); // Проверяем каждую секунду

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  // SDK VK временно отключен
  /*
  useEffect(() => {
    if (isOpen && vkButtonRef.current) {
      // Очищаем контейнер перед инициализацией
      vkButtonRef.current.innerHTML = "";
      setVkSdkLoaded(false);

      // Проверяем, что VKIDSDK доступен
      if (typeof window !== "undefined" && window.VKIDSDK) {
        setVkSdkLoaded(true);
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
            .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, function (payload: unknown) {
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
            });
        } catch (error) {
          console.log("Ошибка инициализации VKID", error);
        }
      }
    }
  }, [isOpen]);
  */

  useEffect(() => {
    if (!isOpen) {
      setForm({ email: "", password: "" });
      setTouched({ email: false, password: false });
      setShowPassword(false);
      setShowVkFallback(false);
      vkOneTapInitialized.current = false;
      if (vkContainerRef.current) vkContainerRef.current.innerHTML = "";
    }
  }, [isOpen]);

  // Если виджет VK не появился за 2.5 с — показываем ссылку-запасной вариант
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      if (!vkOneTapInitialized.current) setShowVkFallback(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [isOpen]);

  // VK ID One Tap: загрузка SDK и рендер виджета в контейнер
  useEffect(() => {
    if (!isOpen) return;

    const redirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/vk`
        : "https://tomilo-lib.ru/auth/vk";

    const initVkOneTap = () => {
      const VKID = getVKID();
      if (
        !vkContainerRef.current ||
        vkOneTapInitialized.current ||
        typeof window === "undefined" ||
        !VKID
      )
        return;
      try {
        VKID.Config.init({
          app: VK_APP_ID,
          redirectUrl,
          responseMode: VKID.Config.ResponseMode.Callback,
          source: VKID.Config.Source.LOWCODE,
          scope: "",
        });
        const container = vkContainerRef.current;
        const oneTap = new VKID.OneTap();
        oneTap
          .render({
            container: container.id ? `#${container.id}` : container,
            showAlternativeLogin: true,
          })
          .on(VKID.WidgetEvents.ERROR, (err: unknown) => {
            console.error("VK One Tap error", err);
          })
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: unknown) => {
            const { code, device_id } = payload as { code: string; device_id: string };
            try {
              const data = await VKID.Auth.exchangeCode(code, device_id);
              const token = (data as { access_token?: string })?.access_token;
              if (!token) throw new Error("No access_token");
              const res = await vkAuthWithToken({ access_token: token }).unwrap();
              authLogin(res);
              onAuthSuccess(res);
              onClose();
            } catch (e) {
              console.error("VK auth failed", e);
            }
          });
        vkOneTapInitialized.current = true;
      } catch (e) {
        console.error("VKID init error", e);
      }
    };

    if (typeof window !== "undefined" && getVKID()) {
      setTimeout(initVkOneTap, 100);
      return;
    }

    let cancelled = false;
    const script = document.createElement("script");
    script.src = VK_ID_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (!cancelled) setTimeout(initVkOneTap, 100);
    };
    script.onerror = () => {
      if (!cancelled && vkContainerRef.current) {
        vkContainerRef.current.innerHTML =
          '<p class="text-sm text-[var(--muted-foreground)]">Виджет VK не загрузился.</p><a href="/auth/vk" class="text-[var(--primary)] text-sm hover:underline">Войти через VK (переход)</a>';
      }
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [isOpen, authLogin, onAuthSuccess, onClose, vkAuthWithToken]);

  const errorMessage = getErrorMessage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={MESSAGES.UI_ELEMENTS.LOGIN_TITLE}>
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
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
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
              placeholder={MESSAGES.UI_ELEMENTS.EMAIL_PLACEHOLDER}
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
            <p id="email-error" className="text-xs text-red-500 flex items-center gap-1">
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
              className={`text-xs cursor-pointer hover:underline ${
                isForgotPasswordLoading
                  ? "text-[var(--muted-foreground)] cursor-not-allowed"
                  : "text-[var(--primary)]"
              }`}
              disabled={isForgotPasswordLoading}
              onClick={async () => {
                if (!form.email) {
                  // Можно показать уведомление о необходимости ввести email
                  return;
                }

                try {
                  await forgotPasswordMutation({ email: form.email }).unwrap();
                  console.log("Письмо для сброса пароля отправлено");
                  // Здесь можно показать уведомление пользователю
                } catch (error: unknown) {
                  console.error(
                    "Ошибка отправки письма для сброса пароля:",
                    (error as { data?: { message?: string } })?.data?.message,
                  );
                }
              }}
            >
              {isForgotPasswordLoading ? "Отправка..." : MESSAGES.UI_ELEMENTS.FORGOT_PASSWORD}
            </button>
          </div>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                errors.password ? "text-red-500" : "text-[var(--muted-foreground)]"
              }`}
            />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={MESSAGES.UI_ELEMENTS.PASSWORD_PLACEHOLDER}
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
              aria-label={
                showPassword
                  ? MESSAGES.UI_ELEMENTS.HIDE_PASSWORD
                  : MESSAGES.UI_ELEMENTS.SHOW_PASSWORD
              }
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-red-500 flex items-center gap-1">
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
              {MESSAGES.UI_ELEMENTS.LOADING}
            </span>
          ) : (
            MESSAGES.UI_ELEMENTS.LOGIN
          )}
        </button>
      </form>

      {/* Разделитель */}
      <div className="px-6 py-2 flex items-center">
        <div className="flex-grow border-t border-[var(--border)]"></div>

        <span className="flex-shrink mx-4 text-xs text-[var(--muted-foreground)]">
          {MESSAGES.UI_ELEMENTS.OR}
        </span>
        <div className="flex-grow border-t border-[var(--border)]"></div>
      </div>

      {/* Кнопки авторизации */}
      <div className="px-6 py-4 space-y-3 relative">
        <div className="flex flex-col items-center gap-3">
          {/* Кнопка Яндекса */}
          <button
            type="button"
            onClick={() => {
              const clientId = "ffd24e1c16544069bc7a1e8c66316f37";
              const redirectUri = encodeURIComponent("https://tomilo-lib.ru/auth/yandex");
              const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}`;
              window.location.href = authUrl;
            }}
            className="w-full max-w-[280px] h-12 bg-[#ff0000] hover:bg-[#ff0000]/80 text-[var(--primary)] font-bold text-sm rounded-lg transition-colors duration-200 flex items-center justify-center border border-gray-600"
            title="Войти через Я.ID"
          >
            Яндекс.ID
          </button>

          {/* VK ID One Tap — официальный виджет (id для селектора) */}
          <div className="w-full max-w-[280px] flex flex-col items-center gap-1">
            <div
              id="vk-onetap-container"
              ref={vkContainerRef}
              className="min-h-[44px] w-full flex items-center justify-center"
              aria-label="Войти через VK ID"
            />
            {isVkAuthLoading && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {MESSAGES.UI_ELEMENTS.LOADING}
              </span>
            )}
            {showVkFallback && (
              <a
                href={
                  typeof window !== "undefined"
                    ? `https://id.vk.com/authorize?client_id=${VK_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/vk")}&response_type=code&scope=${encodeURIComponent("openid email")}`
                    : "#"
                }
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Войти через VK
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          {MESSAGES.UI_ELEMENTS.ALREADY_HAVE_ACCOUNT}{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="cursor-pointer text-[var(--primary)] hover:underline font-medium disabled:opacity-50 transition-colors"
            // disabled={isLoading}
          >
            {MESSAGES.UI_ELEMENTS.REGISTER}
          </button>
        </p>
      </div>
    </Modal>
  );
};

export default LoginModal;
