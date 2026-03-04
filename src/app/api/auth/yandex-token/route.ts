import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/** Лимит: 30 обменов токена с одного IP за 15 минут */
const AUTH_RATE_LIMIT = { max: 30, windowSec: 15 * 60 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSec } = checkRateLimit(`auth-yandex-token:${ip}`, AUTH_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Слишком много попыток. Попробуйте позже." },
      { status: 429, headers: retryAfterSec ? { "Retry-After": String(retryAfterSec) } : undefined },
    );
  }
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { success: false, message: "Токен доступа не предоставлен" },
        { status: 400 },
      );
    }

    // Здесь должна быть логика проверки токена с помощью API Яндекса
    // и получения информации о пользователе

    // Пример проверки токена (псевдокод):
    const userInfo = await fetch("https://login.yandex.ru/info?format=json", {
      headers: {
        Authorization: `OAuth ${access_token}`,
      },
    }).then(res => res.json());

    // Если токен действителен, создаем сессию для пользователя
    // В реальной реализации здесь должна быть логика создания/получения пользователя в БД

    // Отправляем приветственное письмо при OAuth авторизации
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/send-verification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: userInfo.email }), // Здесь должен быть email пользователя из userInfo
        },
      );
    } catch (emailError) {
      console.error("Ошибка отправки приветственного письма:", emailError);
      // Не прерываем основной процесс авторизации из-за ошибки отправки письма
    }

    // Устанавливаем токен в cookies (или используем другую систему сессий)
    const response = NextResponse.json({
      success: true,
      data: { access_token },
      message: "Авторизация успешна",
    });

    // Устанавливаем cookie с токеном (в продакшене нужно настроить secure и httpOnly флаги)
    response.cookies.set("tomilo_lib_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 неделя
      path: "/",
    });

    return response;
  } catch {
    console.error("Ошибка обработки токена Яндекса:");
    return NextResponse.json(
      { success: false, message: "Ошибка обработки токена" },
      { status: 500 },
    );
  }
}
