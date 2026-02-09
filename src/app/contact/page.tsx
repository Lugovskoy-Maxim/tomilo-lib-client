import { Metadata } from "next";
import { Header, Footer } from "@/widgets";
import { pageTitle } from "@/lib/page-title";

export const metadata: Metadata = {
  title: "Контакты - Tomilo-lib.ru",
  description:
    "Свяжитесь с нами. Контактная информация и форма обратной связи платформы Tomilo-lib.ru.",
};

export default function ContactPage() {
  pageTitle.setTitlePage("Контакты - Tomilo-lib.ru");

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-[var(--header-height)] pb-20 lg:py-8 sm:px-6 lg:px-8">
        <div className="space-y-8 pt-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">Свяжитесь с нами</h1>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              У вас есть вопросы, предложения или замечания? Мы всегда рады услышать ваше мнение и
              готовы помочь с любыми вопросами о нашей платформе.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Контактная информация */}
            <div className="space-y-6">
              <div className="bg-[var(--secondary)] p-6 rounded-lg border border-[var(--border)]">
                <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                  Контактная информация
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-[var(--primary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">Email</p>
                      <p className="text-[var(--muted-foreground)]">support@tomilo-lib.ru</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-[var(--primary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">Время ответа</p>
                      <p className="text-[var(--muted-foreground)]">1-3 рабочих дня</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--secondary)] p-6 rounded-lg border border-[var(--border)]">
                <h3 className="text-lg font-semibold mb-3 text-[var(--foreground)]">
                  Что мы можем для вас сделать?
                </h3>
                <ul className="space-y-2 text-[var(--muted-foreground)]">
                  <li>• Помочь с техническими проблемами</li>
                  <li>• Ответить на вопросы о контенте</li>
                  <li>• Принять предложения по улучшению</li>
                  <li>• Рассмотреть жалобы на контент</li>
                  <li>• Предоставить информацию о новых функциях</li>
                </ul>
              </div>
            </div>

            {/* Форма обратной связи */}
            {/* <div className="bg-[var(--secondary)] p-6 rounded-lg border border-[var(--border)]">
              <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                Форма обратной связи
              </h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    placeholder="Введите ваше имя"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Тема
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <option value="">Выберите тему</option>
                    <option value="technical">Техническая проблема</option>
                    <option value="content">Вопросы по контенту</option>
                    <option value="suggestion">Предложение</option>
                    <option value="complaint">Жалоба</option>
                    <option value="other">Другое</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Сообщение
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                    placeholder="Опишите ваш вопрос или проблему..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2 px-4 rounded-md hover:bg-[var(--primary)]/90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2"
                >
                  Отправить сообщение
                </button>
              </form>
            </div> */}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
