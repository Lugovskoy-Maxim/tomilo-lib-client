"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface ContactFormProps {
  className?: string;
  compact?: boolean;
}

export default function ContactForm({ className = "", compact = false }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...(captchaToken && { captchaToken }),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsSubmitting(false);
        setSubmitError(data.message || "Ошибка отправки. Попробуйте позже.");
        return;
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setCaptchaToken(null);

      setTimeout(() => setIsSubmitted(false), 4000);
    } catch {
      setIsSubmitting(false);
      setSubmitError("Ошибка соединения. Проверьте интернет или напишите на support@tomilo-lib.ru");
    }
  };

  if (isSubmitted) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Сообщение отправлено!
        </h3>
        <p className="text-[var(--muted-foreground)]">
          Спасибо за ваше сообщение. Мы свяжемся с вами в ближайшее время.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Свяжитесь с нами</h3>
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-[var(--foreground)]">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              Имя
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
              placeholder="Ваше имя"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-[var(--foreground)] mb-1"
          >
            Тема
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
          >
            <option value="">Выберите тему</option>
            <option value="technical">Техническая проблема</option>
            <option value="content">Вопросы по контенту</option>
            <option value="suggestion">Предложение</option>
            <option value="complaint">Жалоба</option>
            <option value="other">Другое</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-[var(--foreground)] mb-1"
          >
            Сообщение
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
            rows={compact ? 3 : 4}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none text-sm"
            placeholder="Опишите ваш вопрос или проблему..."
          />
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
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (!!TURNSTILE_SITE_KEY && !captchaToken)}
          className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2 px-4 rounded-md hover:bg-[var(--primary)]/90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Отправить
            </>
          )}
        </button>
      </form>
    </div>
  );
}
