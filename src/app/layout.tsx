import { Exo_2, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/shared/ui/Toast";

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
      <body
        className={`${exo_2.variable} ${geistMono.variable} antialiased w-full justify-center items-center`}
      >
        <ToastProvider>
          <Providers>
            <ThemeProvider>{children}</ThemeProvider>
          </Providers>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
