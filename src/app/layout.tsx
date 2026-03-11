import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/contexts/ToastContext";
import { FontProvider } from "@/contexts/FontContext";
import { ProgressNotificationProvider } from "@/contexts/ProgressNotificationContext";
import { OverlayProvider } from "@/contexts/OverlayContext";

import { Suspense } from "react";
import Script from "next/script";
import CookieConsent from "@/shared/cookie-consent/CookieConsent";
import TelegramJoinNotification from "@/shared/telegram-join-notification/TelegramJoinNotification";
import ToastContainer from "@/shared/ui/Toast";
import ProgressNotificationContainer from "@/shared/ui/ProgressNotificationContainer";
import NotificationSocketToasts from "@/shared/ui/NotificationSocketToasts";
import type { Metadata, Viewport } from "next";
import CardTiltEffect from "@/shared/card-tilt/CardTiltEffect";
import ServiceWorkerRegistration from "@/shared/pwa/ServiceWorkerRegistration";
import { OfflineBanner } from "@/shared/pwa/OfflineBanner";
import { AddToHomeScreenBanner } from "@/shared/pwa/AddToHomeScreenBanner";

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
  description:
    "Читайте мангу, манхву и маньхуа онлайн бесплатно. Тысячи тайтлов, удобный ридер, закладки и история чтения. Регулярные обновления, каталог по жанрам.",
  keywords: [
    "манга",
    "манхва",
    "маньхуа",
    "читать онлайн",
    "бесплатно",
    "комиксы",
    "тайтлы",
    "каталог манги",
    "новые главы",
    "ридер",
    "японские комиксы",
    "корейские комиксы",
    "китайские комиксы",
  ],
  authors: [{ name: "Tomilo-lib", url: siteUrl }],
  creator: "Tomilo-lib",
  publisher: "Tomilo-lib.ru",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    yandex: "8f2bae575aa86202",
  },
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": `${siteUrl}/rss`,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "Tomilo-lib.ru",
    title: "Tomilo-lib.ru — Манга, манхва и маньхуа читать онлайн бесплатно",
    description:
      "Читайте мангу, манхву и маньхуа онлайн бесплатно. Тысячи тайтлов, удобный ридер, регулярные обновления.",
    images: [
      {
        url: `${siteUrl}/logo/og-default.png`,
        width: 1200,
        height: 630,
        alt: "Tomilo-lib — манга, манхва, маньхуа онлайн",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tomilo-lib.ru — Манга, манхва и маньхуа читать онлайн бесплатно",
    description: "Читайте мангу, манхву и маньхуа онлайн бесплатно. Тысячи тайтлов, удобный ридер.",
    site: "@tomilo_lib",
    creator: "@tomilo_lib",
    images: [`${siteUrl}/logo/og-default.png`],
  },
  category: "entertainment",
  classification: "Manga Reader",
};

const exo_2 = localFont({
  src: [
    { path: "../fonts/Exo2-cyrillic.woff2", weight: "200 700", style: "normal" },
    { path: "../fonts/Exo2-latin.woff2", weight: "200 700", style: "normal" },
  ],
  variable: "--font-exo_2",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/GeistMono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

const comfortaa = localFont({
  src: [
    { path: "../fonts/Comfortaa-cyrillic.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/Comfortaa-latin.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-comfortaa",
  display: "swap",
});

const nunito = localFont({
  src: [
    { path: "../fonts/Nunito-cyrillic.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/Nunito-latin.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
});

const rubik = localFont({
  src: [
    { path: "../fonts/Rubik-cyrillic.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/Rubik-latin.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-rubik",
  display: "swap",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Tomilo-lib" />

        {/* Дополнительные мета-теги для SEO */}
        <meta name="google" content="notranslate" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="1 days" />
        <meta name="language" content="Russian" />
        <meta name="geo.region" content="RU" />
        <meta name="geo.placename" content="Russia" />
        <meta name="distribution" content="global" />
        <meta name="coverage" content="Worldwide" />

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
          <ProgressNotificationProvider>
            <Providers>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
                storageKey="theme"
              >
                <FontProvider>
                  <OverlayProvider>
                    <div className="contents">
                      <Suspense fallback={null}>
                        <ServiceWorkerRegistration />
                        <OfflineBanner />
                        <AddToHomeScreenBanner />
                      </Suspense>
                      <Suspense fallback={null}>
                        <CardTiltEffect />
                      </Suspense>
                      <div className="max-lg:pb-[var(--mobile-footer-bar-height)]">{children}</div>
                      {/* Уведомления внизу экрана: cookie внизу, Telegram выше; не перекрывают друг друга */}
                      <div className="fixed bottom-4 left-0 right-0 z-[100] flex flex-col-reverse items-center gap-3 px-4 pointer-events-none">
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
                      {/* JSON-LD внутри дерева контента — стабильный порядок узлов, без hydration mismatch */}
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
                                alternateName: "Tomilo-lib",
                                url: siteUrl,
                                logo: {
                                  "@type": "ImageObject",
                                  url: `${siteUrl}/logo/tomilo_color.svg`,
                                  width: 200,
                                  height: 60,
                                },
                                image: `${siteUrl}/logo/og-default.png`,
                                description:
                                  "Читайте мангу, манхву и маньхуа онлайн бесплатно. Каталог тайтлов, удобный ридер, закладки и история чтения.",
                                sameAs: ["https://t.me/tomilolib", "https://t.me/TomiloDev"],
                                contactPoint: {
                                  "@type": "ContactPoint",
                                  email: "support@tomilo-lib.ru",
                                  contactType: "customer support",
                                  availableLanguage: "Russian",
                                },
                              },
                              {
                                "@type": "WebSite",
                                "@id": `${siteUrl}/#website`,
                                url: siteUrl,
                                name: "Tomilo-lib.ru — Манга, манхва и маньхуа онлайн",
                                alternateName: "Томило Либ",
                                description:
                                  "Читайте мангу, манхву и маньхуа онлайн бесплатно. Тысячи тайтлов, регулярные обновления.",
                                publisher: { "@id": `${siteUrl}/#organization` },
                                inLanguage: "ru-RU",
                                potentialAction: [
                                  {
                                    "@type": "SearchAction",
                                    target: {
                                      "@type": "EntryPoint",
                                      urlTemplate: `${siteUrl}/titles?search={search_term_string}`,
                                    },
                                    "query-input": "required name=search_term_string",
                                  },
                                  {
                                    "@type": "ReadAction",
                                    target: `${siteUrl}/titles`,
                                  },
                                ],
                              },
                              {
                                "@type": "WebApplication",
                                "@id": `${siteUrl}/#webapp`,
                                name: "Tomilo-lib",
                                url: siteUrl,
                                applicationCategory: "EntertainmentApplication",
                                operatingSystem: "Web",
                                browserRequirements: "Requires JavaScript",
                                offers: {
                                  "@type": "Offer",
                                  price: "0",
                                  priceCurrency: "RUB",
                                },
                                featureList: [
                                  "Чтение манги онлайн",
                                  "Каталог по жанрам",
                                  "Закладки и история",
                                  "Ежедневные обновления",
                                  "Темная и светлая тема",
                                  "Адаптивный дизайн",
                                ],
                              },
                            ],
                          }),
                        }}
                      />
                    </div>
                  </OverlayProvider>
                </FontProvider>
              </ThemeProvider>
              <NotificationSocketToasts />
            </Providers>
            <ToastContainer />
            <ProgressNotificationContainer />
          </ProgressNotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
