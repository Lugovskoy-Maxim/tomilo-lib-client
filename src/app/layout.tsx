import { Comfortaa, Exo_2, Geist_Mono, Nunito, Rubik } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/contexts/ToastContext";
import { FontProvider } from "@/contexts/FontContext";

import Script from "next/script";
import { CookieConsent, TelegramJoinNotification, ToastContainer } from "@/shared";
import type { Metadata, Viewport } from "next";
import CardTiltEffect from "@/shared/card-tilt/CardTiltEffect";

/** Viewport без ограничения зума — жесты (пинч) работают; авто-зум при фокусе на инпутах убираем через font-size в CSS */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const siteUrl =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru"
    : "https://tomilo-lib.ru";

/** База для разрешения относительных URL в og:image / twitter:image. Без неё соцсети могут не показывать обложку. */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Tomilo-lib",
  title: {
    default: "Tomilo-lib.ru — Манга, манхва и маньхуа читать онлайн бесплатно",
    template: "%s",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const exo_2 = Exo_2({
  variable: "--font-exo_2",
  weight: ["200", "400", "700"],
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["400", "600", "700"],
  subsets: ["latin", "cyrillic"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* РСЯ */}
        <Script id="yandex-rsa-init">{`window.yaContextCb=window.yaContextCb||[]`}</Script>
        <Script src="https://yandex.ru/ads/system/context.js" async></Script>

        {/* Favicon и иконки */}
        <link rel="icon" type="image/x-icon" href="/favicons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicons/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicons/favicon-64x64.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicons/favicon-128x128.png" />
        <link rel="icon" type="image/png" sizes="256x256" href="/favicons/favicon-256x256.png" />

        {/* Apple Touch иконки */}
        <link rel="apple-touch-icon" sizes="57x57" href="/favicons/apple-touch-icon-57x57.png" />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="/favicons/apple-touch-icon-114x114.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/favicons/apple-touch-icon-120x120.png"
        />
        <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" />

        {/* RSS */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Tomilo-lib — Новые тайтлы и главы"
          href={`${process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru"}/rss`}
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/favicons/favicon-256x256.png" />

        {/* Тема и цвета */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-navbutton-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <meta name="yandex-verification" content="8f2bae575aa86202" />

        {/* Глобальная структурированная разметка для поисковиков (Google, Yandex, Bing) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  name: "Tomilo-lib.ru",
                  url: siteUrl,
                  logo: {
                    "@type": "ImageObject",
                    url: `${siteUrl}/logo/tomilo_color.svg`,
                    width: 200,
                    height: 60,
                  },
                  description:
                    "Читайте мангу, манхву и маньхуа онлайн бесплатно. Каталог тайтлов, удобный ридер, закладки и история чтения.",
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  url: siteUrl,
                  name: "Tomilo-lib.ru — Манга, манхва и маньхуа онлайн",
                  description:
                    "Читайте мангу, манхву и маньхуа онлайн бесплатно. Тысячи тайтлов, регулярные обновления.",
                  publisher: { "@id": `${siteUrl}/#organization` },
                  inLanguage: "ru-RU",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${siteUrl}/titles?search={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />

        <Script
          src="https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js"
          strategy="afterInteractive"
        />
        <Script id="yandex-metrika-counter" strategy="beforeInteractive">
          {`
            (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=105475213', 'ym');

    ym(105475213, 'init', {ssr:true, webvisor:true, clickmap:true, accurateTrackBounce:true, trackLinks:true});
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-95QGC7HGHE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-95QGC7HGHE');
          `}
        </Script>
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/105475213"
              style={{ position: "absolute", left: -9999 }}
              alt=""
            />
          </div>
        </noscript>
      </head>
      <body
        className={`${exo_2.variable} ${geistMono.variable} ${comfortaa.variable} ${nunito.variable} ${rubik.variable} antialiased w-full justify-center items-center`}
      >
        <ToastProvider>
          <Providers>
            <ThemeProvider>
              <FontProvider>
                <CardTiltEffect />
              <div className="mobile-footer-spacer">
                {children}
              </div>
              {/* Уведомления внизу экрана: cookie внизу, Telegram выше; не перекрывают друг друга */}
              <div className="fixed bottom-4 left-0 right-0 z-50 flex flex-col-reverse items-center gap-3 px-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-md mx-auto">
                  <CookieConsent />
                </div>
                <div className="pointer-events-auto w-full max-w-md mx-auto">
                  <TelegramJoinNotification />
                </div>
              </div>
              {/* Обработчик сообщений от окна авторизации (Яндекс, VK) */}
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.addEventListener('message', function(event) {
                      if (event.origin !== window.location.origin) return;
                      if (event.data.type === 'YANDEX_LOGIN_SUCCESS' || event.data.type === 'VK_LOGIN_SUCCESS') {
                        // Обновляем localStorage с токеном
                        localStorage.setItem('tomilo_lib_token', event.data.token);
                        // Закрываем модальные окна логина и регистрации если они открыты
                        const loginModal = document.getElementById('login-modal');
                        const registerModal = document.getElementById('register-modal');
                        if (loginModal) loginModal.style.display = 'none';
                        if (registerModal) registerModal.style.display = 'none';
                        // Перезагружаем страницу для обновления состояния авторизации
                        window.location.reload();
                      } else if (event.data.type === 'YANDEX_LOGIN_ERROR') {
                        // Обрабатываем ошибку авторизации
                        console.error('Ошибка авторизации через Яндекс:', event.data.error);
                        // Здесь можно добавить отображение ошибки пользователю
                      }
                    });
                  `,
                }}
              />
            </FontProvider>
            </ThemeProvider>
          </Providers>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
