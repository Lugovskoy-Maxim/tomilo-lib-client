import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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
                var apiBase = ${JSON.stringify(API_BASE)};
                var token = typeof localStorage !== 'undefined' ? localStorage.getItem('tomilo_lib_token') : null;
                var codeVerifier = null;
                try { codeVerifier = sessionStorage.getItem('vk_code_verifier'); } catch (e) {}
                if (!token || !apiBase) {
                    showError('Привязка VK', 'Сессия не найдена. Войдите в аккаунт и снова нажмите «Привязать VK» в профиле.');
                    return;
                }
                if (!codeVerifier) {
                    showError('Привязка VK', 'Сессия истекла. Вернитесь в профиль и снова нажмите «Привязать VK».');
                    return;
                }
                document.getElementById('status').textContent = 'Привязка VK ID…';
                var linkBody = { code: code, redirect_uri: redirectUri, code_verifier: codeVerifier };
                if (deviceId) linkBody.device_id = deviceId;
                if (stateFromUrl) linkBody.state = stateFromUrl;
                function doLink(resolve) {
                    var body = resolve ? Object.assign({}, linkBody, { resolve: resolve }) : linkBody;
                    return fetch(apiBase + '/auth/link/vk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify(body),
                        credentials: 'include'
                    }).then(function(res) { return res.json().then(function(data) { return { status: res.status, data: data }; }); });
                }
                function showConflict(username) {
                    var name = (username && String(username).replace(/</g, '')) || 'другой пользователь';
                    var el = document.getElementById('status');
                    el.innerHTML = '<h1>VK ID уже привязан</h1><p class="status">VK ID уже привязан к пользователю <strong>' + name + '</strong>. Что сделать?</p>' +
                        '<div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:1rem;">' +
                        '<button type="button" id="btn-use-existing" style="padding:0.75rem 1rem;text-align:left;border:1px solid #ccc;border-radius:0.75rem;background:#f5f5f5;cursor:pointer;font-size:0.875rem;">Войти в тот аккаунт</button>' +
                        '<button type="button" id="btn-link-here" style="padding:0.75rem 1rem;text-align:left;border:1px solid #ccc;border-radius:0.75rem;background:#f5f5f5;cursor:pointer;font-size:0.875rem;">Привязать к текущему аккаунту</button>' +
                        '<button type="button" id="btn-merge" style="padding:0.75rem 1rem;text-align:left;border:1px solid #ccc;border-radius:0.75rem;background:#f5f5f5;cursor:pointer;font-size:0.875rem;">Объединить аккаунты</button>' +
                        '</div>' +
                        '<p class="retry" style="margin-top:1rem;"><a href="' + window.location.origin + '">Вернуться на главную</a></p>';
                    var loading = false;
                    function run(resolve) {
                        if (loading) return;
                        loading = true;
                        el.querySelector('#btn-use-existing').disabled = true;
                        el.querySelector('#btn-link-here').disabled = true;
                        el.querySelector('#btn-merge').disabled = true;
                        doLink(resolve).then(function(result) {
                            var d = result.data;
                            if (result.status >= 200 && result.status < 300 && d && d.success) {
                                if (resolve === 'use_existing' && d.data && d.data.access_token) {
                                    try { localStorage.setItem('tomilo_lib_token', d.data.access_token); } catch (e) {}
                                }
                                el.innerHTML = '<p>Готово.</p><p class="retry"><a href="' + window.location.origin + '">Вернуться на сайт</a></p>';
                                setTimeout(function() { window.location.href = window.location.origin; }, 1500);
                            } else {
                                var msg = (d && d.message) ? String(d.message).replace(/</g, '') : 'Не удалось. Попробуйте снова.';
                                if (d && d.errors && d.errors[0]) { var err = d.errors[0]; msg = (typeof err === 'object' && err.message) ? err.message : String(err); }
                                el.innerHTML = '<h1>Ошибка</h1><p>' + msg + '</p><p class="retry"><a href="' + window.location.origin + '">Вернуться на главную</a></p>';
                            }
                        }).catch(function() {
                            loading = false;
                            showError('Ошибка соединения', 'Не удалось связаться с сервером. Попробуйте снова.');
                        });
                    }
                    el.querySelector('#btn-use-existing').onclick = function() { run('use_existing'); };
                    el.querySelector('#btn-link-here').onclick = function() { run('link_here'); };
                    el.querySelector('#btn-merge').onclick = function() { run('merge'); };
                }
                doLink(null)
                .then(function(result) {
                    var d = result.data;
                    if (result.status >= 200 && result.status < 300 && d && d.success) {
                        try { sessionStorage.removeItem('vk_code_verifier'); sessionStorage.removeItem('vk_state'); } catch (e) {}
                        document.getElementById('status').innerHTML = '<p>VK ID успешно привязан.</p><p class="retry"><a href="' + window.location.origin + '">Вернуться на сайт</a></p>';
                        setTimeout(function() { window.location.href = window.location.origin; }, 1500);
                    } else if (result.status === 409 && d && d.data && d.data.conflict && d.data.existingAccount) {
                        showConflict(d.data.existingAccount.username);
                    } else {
                        var msg = (d && d.message) ? String(d.message).replace(/</g, '') : 'Не удалось привязать VK ID.';
                        if (d && d.errors && d.errors[0]) { var err = d.errors[0]; msg = (typeof err === 'object' && err.message) ? err.message : String(err); }
                        showError('Ошибка привязки VK', msg);
                    }
                })
                .catch(function() {
                    showError('Ошибка соединения', 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.');
                });
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
