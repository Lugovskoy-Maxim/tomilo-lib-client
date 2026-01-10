import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Токен или пароль не предоставлен' },
        { status: 400 }
      );
    }

    // Здесь должна быть логика сброса пароля по токену
    // В реальной реализации здесь должен быть вызов почтового модуля
    
    console.log(`Сброс пароля с токеном: ${token}`);
    
    return NextResponse.json({
      success: true,
      message: 'Пароль успешно сброшен'
    });
  } catch (error) {
    console.error('Ошибка сброса пароля:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка сброса пароля' },
      { status: 500 }
    );
  }
}