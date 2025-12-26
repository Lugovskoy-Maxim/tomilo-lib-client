import { NextResponse } from 'next/server';

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>OAuth Callback</title>
</head>
<body>
    <script>
        // Извлекаем токен из URL-фрагмента
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            // Отправляем токен на сервер
            fetch('https://tomilo-lib.ru/api/auth/yandex-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ access_token: accessToken }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Закрываем окно и обновляем opener
                    if (window.opener) {
                        window.opener.postMessage({ type: 'YANDEX_LOGIN_SUCCESS', token: data.data.access_token }, '*');
                        window.close();
                    } else {
                        // Если нет opener, перенаправляем в основное приложение
                        window.location.href = window.location.origin;
                    }
                } else {
                    console.error('Ошибка авторизации:', data.message);
                    // Отобразить ошибку пользователю
                    document.body.innerHTML = '<h1>Ошибка авторизации</h1><p>' + data.message + '</p>';
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                document.body.innerHTML = '<h1>Ошибка авторизации</h1><p>Произошла ошибка при обработке авторизации.</p>';
            });
        } else {
            document.body.innerHTML = '<h1>Ошибка авторизации</h1><p>Токен доступа не найден.</p>';
        }
    </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}