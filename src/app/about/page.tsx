import { Metadata } from "next";
import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { Header, Footer } from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import { Breadcrumbs } from "@/shared";

export const metadata: Metadata = {
  title: "О нас - Tomilo-lib.ru",
  description:
    "Узнайте больше о платформе Tomilo-lib.ru - современной платформе для чтения манги, манхвы и маньхуа.",
};

export default function AboutPage() {
  pageTitle.setTitlePage("О нас - Tomilo-lib.ru");

  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
      <Header />
      <div className="w-full mx-auto px-2 min-[360px]:px-3 py-3 sm:px-4 sm:py-6 max-w-6xl min-w-0 overflow-x-hidden pb-12 sm:pb-16">
        <Breadcrumbs className="mb-6" />
        <div className="content-page-hero">
          <h1>О платформе TOMILO-LIB</h1>
          <p>
            Мы создаем удобное пространство для чтения манги, манхвы и маньхуа: быстрый каталог,
            персональный профиль, сохранение прогресса и понятная навигация на любых устройствах.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="content-card">
            <h2 className="content-card-section-title">Наша миссия</h2>
            <p className="content-card-body">
              Делать чтение максимально простым и приятным: без лишних шагов, с аккуратным
              интерфейсом и фокусом на самом важном - ваших любимых тайтлах.
            </p>
          </section>

          <section className="content-card">
            <h2 className="content-card-section-title">Для кого платформа</h2>
            <p className="content-card-body">
              Для новых читателей, которые только знакомятся с жанром, и для опытных фанатов,
              которым важно быстро находить новинки и возвращаться к чтению с того же места.
            </p>
          </section>

          <section className="content-card">
            <h2 className="content-card-section-title">Что уже доступно</h2>
            <ul className="content-card-body space-y-1">
              <li>Каталог с удобными фильтрами и поиском</li>
              <li>Подборки и рекомендации на главной странице</li>
              <li>Профиль с историей чтения и персональными разделами</li>
              <li>Поддержка светлой и темной темы</li>
              <li>Актуальные обновления глав и карточек тайтлов</li>
            </ul>
          </section>

          <section className="content-card">
            <h2 className="content-card-section-title">Как мы развиваемся</h2>
            <p className="content-card-body">
              Мы регулярно обновляем интерфейс, оптимизируем производительность и учитываем обратную
              связь, чтобы главная, профиль и сервисные страницы работали как единая экосистема.
            </p>
          </section>

          <section className="content-card lg:col-span-2">
            <h2 className="content-card-section-title">
              <Mail className="w-5 h-5" />
              Связь с командой
            </h2>
            <p className="content-card-body">
              Если у вас есть вопросы, идеи или замечания по работе платформы, напишите нам - мы
              внимательно читаем обращения и стараемся ответить максимально быстро.
            </p>
            <div className="content-link-group">
              <Link href="mailto:support@tomilo-lib.ru" className="content-link-primary">
                <Mail className="w-4 h-4" />
                support@tomilo-lib.ru
              </Link>
              <Link
                href="https://t.me/tomilolib"
                target="_blank"
                rel="noopener noreferrer"
                className="content-link-primary"
              >
                <Send className="w-4 h-4" />
                Telegram-канал
              </Link>
              <Link href="/contact" className="content-link-outline">
                Страница контактов
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
