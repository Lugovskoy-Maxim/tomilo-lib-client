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
    <>
      <Header />
      <main className="content-page flex-1">
        <div className="content-page-inner">
          <Breadcrumbs className="mb-6" />
          <div className="content-page-hero">
            <h1>О нас</h1>
            <p>
              <strong className="text-[var(--primary)]">TOMILO-LIB</strong> — современная
              платформа для любителей манги, манхвы и маньхуа. Удобный сервис для чтения и изучения
              азиатской комиксной культуры.
            </p>
          </div>

          <div className="space-y-6">
            <section className="content-card">
              <h2 className="content-card-section-title">Наша задача</h2>
              <p className="content-card-body">
                Мы верим, что каждый человек должен иметь доступ к качественному контенту. Наша
                платформа объединяет сотни произведений, делая их доступными для читателей по всему
                миру. Мы заботимся о комфорте пользователей и постоянно улучшаем наш сервис.
              </p>
            </section>

            <section className="content-card">
              <h2 className="content-card-section-title">Что мы предлагаем</h2>
              <ul className="content-card-body space-y-1">
                <li>Обширная коллекция манги, манхвы, маньхуа и комиксов</li>
                <li>Удобный интерфейс для чтения на любых устройствах</li>
                <li>Регулярные обновления с новыми главами</li>
                <li>Персонализированные рекомендации</li>
                <li>Система закладок и отслеживания прогресса чтения</li>
                <li>Поддержка тёмной и светлой темы</li>
              </ul>
            </section>

            <section className="content-card">
              <h2 className="content-card-section-title">Наша команда</h2>
              <p className="content-card-body">
                Каждый член нашей команды вносит свой вклад в развитие платформы, чтобы сделать ваше
                чтение максимально комфортным и приятным.
              </p>
            </section>

            <section className="content-card">
              <h2 className="content-card-section-title">
                <Mail className="w-5 h-5" />
                Свяжитесь с нами
              </h2>
              <p className="content-card-body">
                Если у вас есть вопросы, предложения или вы хотите сообщить о проблеме — мы всегда
                рады услышать ваше мнение и готовы помочь.
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
                  Мы в Telegram
                </Link>
                <Link href="/contact" className="content-link-outline">
                  Страница контактов
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
