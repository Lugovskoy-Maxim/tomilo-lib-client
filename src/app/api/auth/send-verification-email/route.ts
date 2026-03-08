import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** Лимит: 5 запросов с одного IP за 15 минут */
const AUTH_RATE_LIMIT = { max: 5, windowSec: 15 * 60 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSec } = checkRateLimit(
    `auth-send-verification:${ip}`,
    AUTH_RATE_LIMIT,
  );
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Слишком много попыток. Попробуйте позже." },
      {
        status: 429,
        headers: retryAfterSec ? { "Retry-After": String(retryAfterSec) } : undefined,
      },
    );
  }
  try {
    const { email } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email не предоставлен" },
        { status: 400 },
      );
    }

    const base = API_BASE.replace(/\/$/, "");
    const res = await fetch(`${base}/auth/send-verification-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: (data as { message?: string }).message || "Ошибка отправки письма",
        },
        { status: res.status >= 400 ? res.status : 500 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Письмо подтверждения отправлено",
      ...(typeof data === "object" && data !== null ? data : {}),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Ошибка отправки письма подтверждения" },
      { status: 500 },
    );
  }
}
