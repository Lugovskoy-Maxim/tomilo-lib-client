"use client";
import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useLoginMutation,
  useForgotPasswordMutation,
} from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import { LoginData, FormErrors, FormTouched } from "../../types/form";
import { Modal } from "..";
import { ApiResponseDto } from "@/types/api";
import { AuthResponse } from "@/types/auth";
import { VALIDATION_MESSAGES } from "@/constants/validation";
import { MESSAGES } from "@/constants/messages";

// VK ID по API: https://id.vk.com/about/business/go/docs/ru/vkid/latest/vk-id/connection/api-description
// Запрос кода: GET id.vk.ru/authorize (response_type=code, client_id, redirect_uri, state, code_challenge, code_challenge_method=S256)
const VK_APP_ID = 54445438;
const VK_AUTH_BASE = "https://id.vk.ru";
const VK_STORAGE_VERIFIER = "vk_code_verifier";
const VK_STORAGE_STATE = "vk_state";

/** Случайная строка a-z, A-Z, 0-9, _, -, длина 43–128 (PKCE code_verifier). */
function generateCodeVerifier(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
  let s = "";
  for (let i = 0; i < 64; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

/** state: не короче 32 символов (a-z, A-Z, 0-9, _, -). */
function generateState(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
  let s = "";
  for (let i = 0; i < 43; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

/** Base64url от SHA-256 строки (для code_challenge). */
async function sha256Base64Url(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Редирект на VK ID authorize с PKCE (по документации API). */
async function redirectToVkAuth(): Promise<void> {
  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/auth/vk` : "https://tomilo-lib.ru/auth/vk";
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = generateState();
  try {
    sessionStorage.setItem(VK_STORAGE_VERIFIER, codeVerifier);
    sessionStorage.setItem(VK_STORAGE_STATE, state);
  } catch {
    // sessionStorage недоступен
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: String(VK_APP_ID),
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    scope: "email",
  });
  window.location.href = `${VK_AUTH_BASE}/authorize?${params.toString()}`;
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
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [touched, setTouched] = useState<FormTouched<LoginData>>({
    email: false,
    password: false,
  });

  const [loginMutation, { isLoading, error }] = useLoginMutation();
  const [forgotPasswordMutation, { isLoading: isForgotPasswordLoading }] =
    useForgotPasswordMutation();
  const { login: authLogin } = useAuth();

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
      setForgotPasswordSuccess(false);
      setForgotPasswordError(null);
    }
  }, [isOpen]);

  const errorMessage = getErrorMessage();

  const inputBase =
    "w-full pl-10 pr-4 py-3 rounded-xl border bg-[var(--secondary)] placeholder:text-[var(--muted-foreground)]/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/30 focus:border-[var(--chart-1)]";
  const inputError = "border-red-500 focus:ring-red-500/20";
  const inputNormal = "border-[var(--border)] hover:border-[var(--muted-foreground)]/50";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={MESSAGES.UI_ELEMENTS.LOGIN_TITLE}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {MESSAGES.UI_ELEMENTS.LOGIN_SUBTITLE}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {(errorMessage || forgotPasswordSuccess || forgotPasswordError) && (
            <div className="flex flex-col gap-2">
              {errorMessage && (
                <div
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-fadeIn"
                  role="alert"
                  aria-live="assertive"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {forgotPasswordSuccess && (
                <div
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{MESSAGES.UI_ELEMENTS.FORGOT_PASSWORD_SENT}</span>
                </div>
              )}
              {forgotPasswordError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{forgotPasswordError}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
              Email
            </label>
            <div className="relative">
              <Mail
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
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
                className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                required
                name="email"
                disabled={isLoading}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-xs text-red-500 flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)]">
                Пароль
              </label>
              <button
                type="button"
                className={`text-xs min-h-[2rem] inline-flex items-center cursor-pointer transition-colors rounded-lg px-2 -mx-2 focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/30 ${
                  isForgotPasswordLoading
                    ? "text-[var(--muted-foreground)] cursor-not-allowed"
                    : "text-[var(--chart-1)] hover:underline hover:bg-[var(--secondary)]"
                }`}
                disabled={isForgotPasswordLoading}
                onClick={async () => {
                  if (!form.email) return;
                  setForgotPasswordSuccess(false);
                  setForgotPasswordError(null);
                  try {
                    await forgotPasswordMutation({ email: form.email }).unwrap();
                    setForgotPasswordSuccess(true);
                    setForgotPasswordError(null);
                  } catch (err: unknown) {
                    const msg = (err as { data?: { message?: string } })?.data?.message;
                    setForgotPasswordError(msg || "Не удалось отправить письмо");
                    setForgotPasswordSuccess(false);
                  }
                }}
              >
                {isForgotPasswordLoading ? MESSAGES.UI_ELEMENTS.FORGOT_PASSWORD_SENDING : MESSAGES.UI_ELEMENTS.FORGOT_PASSWORD}
              </button>
            </div>
            <div className="relative">
              <Lock
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
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
                className={`${inputBase} pr-11 ${errors.password ? inputError : inputNormal}`}
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/20"
                disabled={isLoading}
                aria-label={showPassword ? MESSAGES.UI_ELEMENTS.HIDE_PASSWORD : MESSAGES.UI_ELEMENTS.SHOW_PASSWORD}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-red-500 flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.password}
              </p>
            )}
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
              MESSAGES.UI_ELEMENTS.LOGIN
            )}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            {MESSAGES.UI_ELEMENTS.OR}
          </span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              const clientId = "ffd24e1c16544069bc7a1e8c66316f37";
              const redirectUri = encodeURIComponent("https://tomilo-lib.ru/auth/yandex");
              window.location.href = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}`;
            }}
            className="w-full py-3.5 rounded-xl font-medium border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--muted)] hover:border-[var(--muted-foreground)]/30 transition-colors flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/30 focus:ring-offset-2 focus:ring-offset-[var(--background)] min-h-[3rem]"
            title="Войти через Я.ID"
          >
            <span className="text-[#FC3F1D] font-bold text-lg">Я</span>
            <span>Яндекс.ID</span>
          </button>
          <button
            type="button"
            onClick={() => void redirectToVkAuth()}
            className="w-full py-3.5 rounded-xl font-medium bg-[#0077FF] hover:bg-[#0066DD] text-white transition-colors flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#0077FF]/50 focus:ring-offset-2 focus:ring-offset-[var(--background)] min-h-[3rem]"
            title="Войти через VK ID"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z" />
            </svg>
            <span>VK ID</span>
          </button>
        </div>

        <div className="pt-4 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {MESSAGES.UI_ELEMENTS.NO_ACCOUNT}{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[var(--chart-1)] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/30 focus:ring-offset-2 focus:ring-offset-[var(--background)] rounded px-1 -mx-1"
            >
              {MESSAGES.UI_ELEMENTS.REGISTER}
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;
