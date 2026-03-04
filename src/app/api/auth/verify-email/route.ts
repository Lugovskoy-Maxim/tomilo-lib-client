import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** Лимит: 20 запросов верификации с одного IP за 15 минут */
const AUTH_RATE_LIMIT = { max: 20, windowSec: 15 * 60 };

/**
 * Прокси верификации email: передаёт токен на бэкенд, не логирует токен.
 * Бэкенд должен реализовать GET или POST /auth/verify-email с параметром token.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSec } = checkRateLimit(`auth-verify-email:${ip}`, AUTH_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Слишком много попыток. Попробуйте позже." },
      { status: 429, headers: retryAfterSec ? { "Retry-After": String(retryAfterSec) } : undefined },
    );
  }
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Токен не предоставлен" },
        { status: 400 },
      );
    }

    const base = API_BASE.replace(/\/$/, "");
    const verifyUrl = `${base}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const res = await fetch(verifyUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: (data as { message?: string }).message || "Ошибка подтверждения email" },
        { status: res.status === 400 || res.status === 401 ? res.status : 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email успешно подтверждён",
      ...(typeof data === "object" && data !== null ? data : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Ошибка подтверждения email" },
      { status: 500 },
    );
  }
}
