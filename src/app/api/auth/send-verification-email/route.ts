import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email не предоставлен' },
        { status: 400 }
      );
    }

    // Здесь должна быть логика отправки письма подтверждения email
    // В реальной реализации здесь должен быть вызов почтового модуля
    
    console.log(`Отправка письма подтверждения на email: ${email}`);
    
    return NextResponse.json({
      success: true,
      message: 'Письмо подтверждения отправлено'
    });
  } catch (error) {
    console.error('Ошибка отправки письма подтверждения:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка отправки письма подтверждения' },
      { status: 500 }
    );
  }
}