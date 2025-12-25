import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { success: false, message: 'Токен доступа не предоставлен' },
        { status: 400 }
      );
    }

    // Здесь должна быть логика проверки токена с помощью API Яндекса
    // и получения информации о пользователе
    
    // Пример проверки токена (псевдокод):
    // const userInfo = await fetch('https://login.yandex.ru/info?format=json', {
    //   headers: {
    //     'Authorization': `OAuth ${access_token}`
    //   }
    // }).then(res => res.json());
    
    // Если токен действителен, создаем сессию для пользователя
    // В реальной реализации здесь должна быть логика создания/получения пользователя в БД
    
    // Устанавливаем токен в cookies (или используем другую систему сессий)
    const response = NextResponse.json({
      success: true,
      data: { access_token },
      message: 'Авторизация успешна'
    });
    
    // Устанавливаем cookie с токеном (в продакшене нужно настроить secure и httpOnly флаги)
    response.cookies.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 неделя
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Ошибка обработки токена Яндекса:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка обработки токена' },
      { status: 500 }
    );
  }
}