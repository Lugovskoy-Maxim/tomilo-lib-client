import { NextResponse } from "next/server";

const SUBJECT_LABELS: Record<string, string> = {
  technical: "Техническая проблема",
  content: "Вопросы по контенту",
  suggestion: "Предложение",
  complaint: "Жалоба",
  other: "Другое",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

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
