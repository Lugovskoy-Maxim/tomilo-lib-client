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
    <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
      <Header />
      <div className="w-full mx-auto px-2 min-[360px]:px-3 py-3 sm:px-4 sm:py-6 max-w-6xl min-w-0 overflow-x-hidden pb-12 sm:pb-16">
        <Breadcrumbs className="mb-6" />
        <div className="content-page-hero">
          <h1>Контакты</h1>
          <p>
            Если вы столкнулись с проблемой, хотите предложить улучшение или задать вопрос по
            сервису, напишите нам удобным способом. Мы всегда на связи.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="content-card">
            <h2 className="content-card-section-title">Каналы связи</h2>
            <div className="space-y-4">
              <Link href="mailto:support@tomilo-lib.ru" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center group-hover:opacity-90 transition-opacity">
                  <Mail className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">Email поддержки</p>
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
                    Официальный канал
                  </p>
                </div>
              </Link>

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
                  <p className="font-medium text-[var(--foreground)] text-sm">Разработка</p>
                  <p className="text-[var(--chart-1)] text-sm group-hover:underline">
                    @TomiloDev
                  </p>
                </div>
              </Link>
            </div>
          </section>

          <section className="content-card">
            <h2 className="content-card-section-title">
              <Clock className="w-5 h-5" />
              Как быстрее получить ответ
            </h2>
            <ul className="content-card-body space-y-1">
              <li>Укажите ссылку на страницу, где возникла проблема</li>
              <li>Опишите шаги, после которых появляется ошибка</li>
              <li>Если возможно, приложите скриншот</li>
              <li>Для вопросов по контенту укажите название тайтла</li>
              <li>Среднее время ответа: 1-3 рабочих дня</li>
            </ul>
          </section>

          <section className="content-card lg:col-span-2">
            <h3 className="content-card-section-title text-base">По каким вопросам можно писать</h3>
            <ul className="content-card-body text-sm space-y-1">
              <li>Технические проблемы и ошибки интерфейса</li>
              <li>Предложения по новым функциям</li>
              <li>Пожелания по улучшению навигации и профиля</li>
              <li>Жалобы и обращения по контенту</li>
              <li>Вопросы по правилам и пользовательскому соглашению</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
