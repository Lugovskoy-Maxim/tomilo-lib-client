import { Metadata } from "next";
import { Header, Footer } from "@/widgets";
import { pageTitle } from "@/lib/page-title";

export const metadata: Metadata = {
  title: "О нас - Tomilo-lib.ru",
  description: "Узнайте больше о платформе Tomilo-lib.ru - современной платформе для чтения маньхуя и комиксов.",
};

export default function AboutPage() {
  pageTitle.setTitlePage("О нас - Tomilo-lib.ru");

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-20 md:pb-2">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">
            О нас
          </h1>

          <div className="space-y-6 text-[var(--foreground)]">
            <p className="text-lg leading-relaxed">
              <strong className="text-[var(--primary)]">TOMILO-LIB</strong> — это современная платформа,
              созданная для любителей маньхуя и комиксов. Мы стремимся предоставить удобный и качественный
              сервис для чтения и изучения азиатской комиксной культуры.
            </p>

            <div className="bg-[var(--secondary)] p-6 rounded-lg border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                Наша миссия
              </h2>
              <p className="leading-relaxed">
                Мы верим, что каждый человек должен иметь доступ к качественному контенту.
                Наша платформа объединяет сотни произведений, делая их доступными для читателей
                по всему миру. Мы заботимся о комфорте пользователей и постоянно улучшаем наш сервис.
              </p>
            </div>

            <div className="bg-[var(--secondary)] p-6 rounded-lg border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                Что мы предлагаем
              </h2>
              <ul className="space-y-2 list-disc list-inside leading-relaxed">
                <li>Обширная коллекция манги и манхвы и маньхуя и комиксов</li>
                <li>Удобный интерфейс для чтения на любых устройствах</li>
                <li>Регулярные обновления с новыми главами</li>
                <li>Персонализированные рекомендации</li>
                <li>Система закладок и отслеживания прогресса чтения</li>
                <li>Поддержка темной и светлой темы</li>
              </ul>
            </div>

            <div className="bg-[var(--secondary)] p-6 rounded-lg border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                Наша команда
              </h2>
              <p className="leading-relaxed">
                Каждый член нашей команды вносит свой вклад в развитие платформы,
                чтобы сделать ваше чтение максимально комфортным и приятным.
              </p>
            </div>

            <div className="bg-[var(--secondary)] p-6 rounded-lg border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                Свяжитесь с нами
              </h2>
              <p className="leading-relaxed">
                Если у вас есть вопросы, предложения или вы хотите сообщить о проблеме,
                пожалуйста, свяжитесь с нами по электронной почте или в группе в Telegram.
                Мы всегда рады услышать ваше мнение и готовы помочь!
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
