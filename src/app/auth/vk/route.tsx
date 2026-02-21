import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const deviceId = searchParams.get("device_id");
  const stateFromUrl = searchParams.get("state");

  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VK — вход</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; max-width: 32rem; margin-left: auto; margin-right: auto; }
        .status { margin: 1rem 0; }
        a { color: #0077FF; }
        .retry { margin-top: 1rem; }
    </style>
</head>
<body>
    <div id="status" class="status">Проверка авторизации…</div>
    <script>
        function showError(title, text) {
            var el = document.getElementById('status');
            el.innerHTML = '<h1>' + title + '</h1><p>' + text + '</p>' +
                '<p class="retry"><a href="/">Вернуться на главную</a></p>' +
                '<p><a href="#" onclick="window.location.reload(); return false;">Попробовать снова</a></p>';
        }
        (function() {
            var code = ${JSON.stringify(code)};
            var error = ${JSON.stringify(error)};
            var errorDescription = ${JSON.stringify(errorDescription)};
            var deviceId = ${JSON.stringify(deviceId)};
            var stateFromUrl = ${JSON.stringify(stateFromUrl)};

            if (error) {
                showError('Ошибка авторизации VK', (errorDescription || error).replace(/</g, ''));
                return;
            }

            if (!code) {
                showError('Ошибка авторизации', 'Код авторизации не получен. Возможно, вы закрыли окно VK или отменили вход. Проверьте, что в настройках приложения VK указан адрес: ' + window.location.origin + '/auth/vk');
                return;
            }

            var redirectUri = window.location.origin + '/auth/vk';
            var isLinkMode = stateFromUrl && stateFromUrl.indexOf('link_') === 0;
            if (isLinkMode) {
                if (window.opener) {
                    window.opener.postMessage({ type: 'VK_LINK_CODE', code: code, redirect_uri: redirectUri }, '*');
                    window.close();
                    return;
                }
                showError('Привязка VK', 'Это окно открыто не из профиля. Закройте его и нажмите «Привязать VK» на странице профиля.');
                return;
            }

            var codeVerifier = null;
            var savedState = null;
            try {
                codeVerifier = sessionStorage.getItem('vk_code_verifier');
                savedState = sessionStorage.getItem('vk_state');
            } catch (e) {}
            if (!codeVerifier) {
                showError('Ошибка входа', 'Сессия истекла. Вернитесь на страницу входа и нажмите «VK ID» снова.');
                return;
            }
            var body = {
                code: code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
                device_id: deviceId || undefined,
                state: stateFromUrl || savedState || undefined
            };
            try {
                sessionStorage.removeItem('vk_code_verifier');
                sessionStorage.removeItem('vk_state');
            } catch (e) {}

            fetch('/api/auth/vk-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            .then(function(res) {
                return res.json().then(function(data) { return { ok: res.ok, data: data }; }).catch(function() {
                    return { ok: false, data: { message: 'Сервер вернул неверный ответ. Попробуйте позже.' } };
                });
            })
            .then(function(result) {
                var data = result.data;
                if (result.ok && data.success && data.data && data.data.access_token) {
                    localStorage.setItem('tomilo_lib_token', data.data.access_token);
                    if (window.opener) {
                        window.opener.postMessage({ type: 'VK_LOGIN_SUCCESS', token: data.data.access_token }, '*');
                        window.close();
                    } else {
                        window.location.href = window.location.origin;
                    }
                } else {
                    var raw = (data && data.message) ? String(data.message).replace(/</g, '') : '';
                    var msg = raw;
                    if (/error loading|please try again|try again later/i.test(raw)) {
                        msg = 'Ошибка загрузки. Попробуйте ещё раз. Если не получится — попробуйте позже или войдите по email.';
                    }
                    if (!msg) msg = 'Не удалось войти через VK. Попробуйте позже или войдите по email.';
                    showError('Ошибка входа через VK', msg);
                }
            })
            .catch(function(err) {
                console.error(err);
                showError('Ошибка соединения', 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.');
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
