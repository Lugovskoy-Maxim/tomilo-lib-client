import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      redirect_uri,
      access_token: accessToken,
    } = body as {
      code?: string;
      redirect_uri?: string;
      access_token?: string;
    };

    const hasCode = !!code;
    const hasToken = !!accessToken;
    if (!hasCode && !hasToken) {
      return NextResponse.json(
        { success: false, message: "Код или токен не предоставлен" },
        { status: 400 },
      );
    }

    const backendUrl = `${BACKEND_BASE}/auth/vk-token`;
    const backendBody = hasToken
      ? { access_token: accessToken }
      : {
          code,
          redirect_uri:
            redirect_uri ||
            `${process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru"}/auth/vk`,
        };
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendBody),
    });

    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Ошибка обмена кода VK на сервере",
        },
        { status: backendResponse.status >= 400 ? backendResponse.status : 500 },
      );
    }

    const response = NextResponse.json(data);
    if (data.success && data.data?.access_token) {
      response.cookies.set("tomilo_lib_token", data.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }
    return response;
  } catch (err) {
    console.error("Ошибка обработки VK токена:", err);
    return NextResponse.json(
      { success: false, message: "Ошибка обработки авторизации VK" },
      { status: 500 },
    );
  }
}
