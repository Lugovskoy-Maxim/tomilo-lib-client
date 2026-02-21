import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Вход через Яндекс</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; max-width: 32rem; margin-left: auto; margin-right: auto; text-align: center; }
        .status { margin: 1rem 0; color: #666; }
        a { color: #0077FF; }
        .retry { margin-top: 1rem; }
    </style>
</head>
<body>
    <div id="status" class="status">Выполняется вход…</div>
    <script>
        (function() {
            var origin = window.location.origin || 'https://tomilo-lib.ru';
            function setStatus(html) {
                var el = document.getElementById('status');
                if (el) el.innerHTML = html;
            }
            function redirectHome() {
                window.location.replace(origin);
            }
            // Таймаут: если через 15 сек ничего не произошло — редирект на главную
            var timeout = setTimeout(function() {
                setStatus('<p>Вход занимает больше времени, чем обычно.</p><p><a href="' + origin + '">Перейти на главную</a></p>');
            }, 15000);

            var hash = window.location.hash ? window.location.hash.substring(1) : '';
            var params = new URLSearchParams(hash);
            var accessToken = params.get('access_token');

            if (!accessToken) {
                clearTimeout(timeout);
                setStatus('<h1>Ошибка авторизации</h1><p>Токен доступа не найден. Возможно, вы перешли по ссылке без параметров от Яндекса.</p><p class="retry"><a href="' + origin + '">Вернуться на главную</a></p>');
                return;
            }

            var linkMode = sessionStorage.getItem('yandex_link_mode');
            if (linkMode === '1' && window.opener) {
                sessionStorage.removeItem('yandex_link_mode');
                window.opener.postMessage({ type: 'YANDEX_LINK_TOKEN', access_token: accessToken }, '*');
                window.close();
                return;
            }
            if (linkMode === '1') sessionStorage.removeItem('yandex_link_mode');

            fetch(origin + '/api/auth/yandex-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: accessToken }),
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                clearTimeout(timeout);
                if (data && data.success && data.data && data.data.access_token) {
                    try { localStorage.setItem('tomilo_lib_token', data.data.access_token); } catch (e) {}
                    if (window.opener) {
                        window.opener.postMessage({ type: 'YANDEX_LOGIN_SUCCESS', token: data.data.access_token }, '*');
                        window.close();
                    } else {
                        window.location.replace(origin);
                    }
                } else {
                    var msg = (data && data.message) ? data.message : 'Сервер вернул ошибку.';
                    setStatus('<h1>Ошибка авторизации</h1><p>' + msg.replace(/</g, '&lt;') + '</p><p class="retry"><a href="' + origin + '">Вернуться на главную</a></p>');
                }
            })
            .catch(function(err) {
                clearTimeout(timeout);
                console.error('Yandex auth error:', err);
                setStatus('<h1>Ошибка авторизации</h1><p>Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.</p><p class="retry"><a href="' + origin + '">Вернуться на главную</a></p>');
            });
        })();
    </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
