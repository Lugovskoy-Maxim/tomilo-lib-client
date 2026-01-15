import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email не предоставлен" },
        { status: 400 },
      );
    }

    // Здесь должна быть логика отправки письма для сброса пароля
    // В реальной реализации здесь должен быть вызов почтового модуля

    console.log(`Отправка письма для сброса пароля на email: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Письмо для сброса пароля отправлено",
    });
  } catch (error) {
    console.error("Ошибка отправки письма для сброса пароля:", error);
    return NextResponse.json(
      { success: false, message: "Ошибка отправки письма для сброса пароля" },
      { status: 500 },
    );
  }
}
