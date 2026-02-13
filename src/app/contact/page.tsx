import { Metadata } from "next";
import Link from "next/link";
import { Mail, Send, Clock, Code } from "lucide-react";
import { Header, Footer } from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import { Breadcrumbs } from "@/shared";

export const metadata: Metadata = {
  title: "Контакты - Tomilo-lib.ru",
  description:
    "Свяжитесь с нами. Контактная информация платформы Tomilo-lib.ru — email и Telegram.",
};

export default function ContactPage() {
  pageTitle.setTitlePage("Контакты - Tomilo-lib.ru");

  return (
    <>
      <Header />
      <main className="content-page flex-1">
        <div className="content-page-inner">
          <Breadcrumbs className="mb-6" />
          <div className="content-page-hero">
            <h1>Свяжитесь с нами</h1>
            <p>
              У вас есть вопросы, предложения или замечания? Мы рады услышать ваше мнение и готовы
              помочь с любыми вопросами о нашей платформе.
            </p>
          </div>

          <div className="max-w-2xl space-y-6">
            <section className="content-card">
              <h2 className="content-card-section-title">Контактная информация</h2>
              <div className="space-y-4">
                <Link
                  href="mailto:support@tomilo-lib.ru"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center group-hover:opacity-90 transition-opacity">
                    <Mail className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm">Email</p>
                    <p className="text-[var(--chart-1)] text-sm group-hover:underline">
                      support@tomilo-lib.ru
                    </p>
                  </div>
                </Link>

                <Link
                  href="https://t.me/tomilolib"
                    target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center group-hover:opacity-90 transition-opacity">
                    <Send className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm">Telegram</p>
                    <p className="text-[var(--chart-1)] text-sm group-hover:underline">
                      Мы в Telegram
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm">Время ответа</p>
                    <p className="text-[var(--muted-foreground)] text-sm">1–3 рабочих дня</p>
                  </div>
                </div>

                <Link
                  href="https://t.me/TomiloDev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center group-hover:opacity-90 transition-opacity">
                    <Code className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm">Разработчик</p>
                    <p className="text-[var(--chart-1)] text-sm group-hover:underline">
                      @TomiloDev (Telegram)
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            <section className="content-card">
              <h3 className="content-card-section-title text-base">
                Что мы можем для вас сделать?
              </h3>
              <ul className="content-card-body text-sm space-y-1">
                <li>Помочь с техническими проблемами</li>
                <li>Ответить на вопросы о контенте</li>
                <li>Принять предложения по улучшению</li>
                <li>Рассмотреть жалобы на контент</li>
                <li>Рассказать о новых функциях</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
