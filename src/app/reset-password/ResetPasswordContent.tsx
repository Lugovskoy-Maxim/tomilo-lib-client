"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { BackButton } from "@/shared";
import { useToast } from "@/hooks/useToast";
import Button from "@/shared/ui/button";
import Input from "@/shared/ui/input";
import { VALIDATION_MESSAGES } from "@/constants/validation";

interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  
  const [formData, setFormData] = useState<ResetPasswordData>({
    password: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Получаем токен из URL
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      error("Неверная ссылка для сброса пароля");
      router.push("/");
    }
  }, [searchParams, router, error]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Валидация пароля
    if (!formData.password) {
      newErrors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    }
    
    // Валидация подтверждения пароля
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Подтверждение пароля обязательно";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ResetPasswordData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (!token) {
      error("Неверная ссылка для сброса пароля");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Отправляем запрос на сброс пароля
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password: formData.password
          }),
        }
      );
      
      const result = await response.json();
      
      if (response.ok) {
        success("Пароль успешно изменен");

        // Ждем 5 секунд перед перенаправлением
        setTimeout(() => {
          router.push("/");
        }, 5000);
      } else {
        error(result.message || "Не удалось сбросить пароль");
      }
    } catch (err) {
      console.error("Ошибка сброса пароля:", err);
      error("Произошла ошибка при сбросе пароля");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--muted-foreground)] mb-2">
          Сброс пароля
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Введите новый пароль для вашей учетной записи
        </p>
      </div>

      {/* Форма сброса пароля */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле пароля */}
          <div>
            <Input
              id="password"
              type="password"
              placeholder="Введите новый пароль"
              value={formData.password}
              onChange={handleChange("password")}
              error={errors.password}
              icon={Lock}
              showPasswordToggle
              isPasswordVisible={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Поле подтверждения пароля */}
          <div>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Подтвердите новый пароль"
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              error={errors.confirmPassword}
              icon={Lock}
              showPasswordToggle
              isPasswordVisible={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Кнопка отправки */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer border-2 border-[var(--border)] rounded-full bg-[var(--chart-1)] text-[var(--primary)] hover:bg-[var(--chart-1)]/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[var(--border)] border-t-transparent rounded-full animate-spin"></span>
                Обновление пароля...
              </span>
            ) : (
              "Сбросить пароль"
            )}
          </Button>
        </form>
      </div>

      {/* Кнопка на главную страницу */}
      <div className="mt-6">
        <Button onClick={() => router.push("/")} className="w-full cursor-pointer border-2 border-[var(--border)] rounded-full bg-[var(--chart-1)] text-[var(--primary)] hover:bg-[var(--chart-1)]/80 transition-all duration-300">
          На главную
        </Button>
      </div>
    </>
  );
}