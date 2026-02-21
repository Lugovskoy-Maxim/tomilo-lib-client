import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const SUBJECT_LABELS: Record<string, string> = {
  technical: "Техническая проблема",
  content: "Вопросы по контенту",
  suggestion: "Предложение",
  complaint: "Жалоба",
  other: "Другое",
};

/** Лимит: 5 отправок формы с одного IP за 15 минут (защита от спама/DDoS) */
const CONTACT_RATE_LIMIT = { max: 5, windowSec: 15 * 60 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSec } = checkRateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Слишком много попыток. Попробуйте позже." },
      { status: 429, headers: retryAfterSec ? { "Retry-After": String(retryAfterSec) } : undefined },
    );
  }

  try {
    const body = await request.json();
    const { name, email, subject, message, captchaToken } = body;

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (turnstileSecret && turnstileSiteKey) {
      if (!captchaToken?.trim()) {
        return NextResponse.json(
          { success: false, message: "Подтвердите, что вы не робот (капча)" },
          { status: 400 },
        );
      }
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: captchaToken,
          remoteip: ip,
        }),
      });
      const verifyData = (await verifyRes.json()) as { success?: boolean; "error-codes"?: string[] };
      if (!verifyData?.success) {
        return NextResponse.json(
          { success: false, message: "Проверка капчи не пройдена. Попробуйте ещё раз." },
          { status: 400 },
        );
      }
    }

    if (!name?.trim() || !email?.trim() || !subject || !message?.trim()) {
      return NextResponse.json(
        { success: false, message: "Заполните все обязательные поля" },
        { status: 400 },
      );
    }

    const subjectLabel = SUBJECT_LABELS[subject] || subject;
    const payload = { name: name.trim(), email: email.trim(), subject: subjectLabel, message: message.trim() };

    // Опционально: отправить на бэкенд, если задан endpoint
    const backendUrl = process.env.CONTACT_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl) {
      const res = await fetch(`${backendUrl.replace(/\/$/, "")}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Contact backend error:", res.status, text);
        return NextResponse.json(
          { success: false, message: "Не удалось отправить сообщение. Попробуйте позже." },
          { status: 502 },
        );
      }
    } else {
      // Логирование для разработки / когда нет бэкенда для контактов
      console.log("[Contact form]", payload);
    }

    return NextResponse.json({
      success: true,
      message: "Сообщение отправлено",
    });
  } catch (error) {
    console.error("Ошибка обработки формы контактов:", error);
    return NextResponse.json(
      { success: false, message: "Ошибка отправки. Попробуйте позже или напишите на support@tomilo-lib.ru" },
      { status: 500 },
    );
  }
}
