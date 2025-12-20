import { Exo_2, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/contexts/ToastContext";

import { ToastContainer } from "@/shared/ui/Toast";
import Script from "next/script";

const exo_2 = Exo_2({
  variable: "--font-exo_2",
  weight: ["200", "400", "700"],
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="yandex-verification" content="8f2bae575aa86202" />
        <Script
          src="https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js"
          strategy="beforeInteractive"
        />
        <Script id="yandex-metrika-counter" strategy="beforeInteractive">
          {`
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=105475213', 'ym');

            ym(105475213, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
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
        className={`${exo_2.variable} ${geistMono.variable} antialiased w-full justify-center items-center`}
      >
        <ToastProvider>
          <Providers>
            <ThemeProvider>
                {children}

            </ThemeProvider>
          </Providers>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
