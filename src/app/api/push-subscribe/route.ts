import { NextRequest, NextResponse } from "next/server";

/**
 * Placeholder: сохраняет подписку на Web Push для отправки уведомлений о новых главах.
 * Для полной реализации нужен backend: VAPID keys, сохранение subscription в БД, отправка через web-push.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
    }
    // TODO: validate subscription object, save to DB, associate with user (auth required)
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
