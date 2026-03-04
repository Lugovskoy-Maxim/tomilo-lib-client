import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** Лимит: 10 попыток сброса пароля с одного IP за 15 минут */
const AUTH_RATE_LIMIT = { max: 10, windowSec: 15 * 60 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSec } = checkRateLimit(`auth-reset-password:${ip}`, AUTH_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Слишком много попыток. Попробуйте позже." },
      { status: 429, headers: retryAfterSec ? { "Retry-After": String(retryAfterSec) } : undefined },
    );
  }
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Токен или пароль не предоставлен" },
        { status: 400 },
      );
    }

    const base = API_BASE.replace(/\/$/, "");
    const res = await fetch(`${base}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: (data as { message?: string }).message || "Ошибка сброса пароля" },
        { status: res.status >= 400 ? res.status : 500 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Пароль успешно сброшен",
      ...(typeof data === "object" && data !== null ? data : {}),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Ошибка сброса пароля" }, { status: 500 });
  }
}
