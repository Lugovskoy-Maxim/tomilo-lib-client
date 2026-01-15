import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Токен не предоставлен" },
        { status: 400 },
      );
    }

    // Здесь должна быть логика проверки токена и подтверждения email
    // В реальной реализации здесь должен быть вызов почтового модуля

    console.log(`Подтверждение email с токеном: ${token}`);

    return NextResponse.json({
      success: true,
      message: "Email успешно подтвержден",
    });
  } catch (error) {
    console.error("Ошибка подтверждения email:", error);
    return NextResponse.json(
      { success: false, message: "Ошибка подтверждения email" },
      { status: 500 },
    );
  }
}
