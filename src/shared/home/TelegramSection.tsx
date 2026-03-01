"use client";

import { Send, Bell, MessageCircle, Zap } from "lucide-react";
import Image from "next/image";

const TELEGRAM_FEATURES = [
  { icon: Bell, text: "Уведомления о новых главах" },
  { icon: Zap, text: "Эксклюзивный контент" },
  { icon: MessageCircle, text: "Общение с сообществом" },
];

export function TelegramSection() {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0088cc]/20 via-[#00aaff]/10 to-[#0088cc]/5">
        <div className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-5" />
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0088cc]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00aaff]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative flex-shrink-0 group">
              <div className="absolute inset-0 bg-[#0088cc]/20 rounded-full blur-xl group-hover:bg-[#0088cc]/30 transition-colors" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                <Image 
                  src="/tg/tg.png" 
                  alt="Telegram" 
                  fill
                  className="object-contain drop-shadow-lg"
                  style={{ 
                    filter: "brightness(0) saturate(100%) invert(38%) sepia(98%) saturate(1029%) hue-rotate(175deg) brightness(96%) contrast(101%)" 
                  }}
                />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
                Присоединяйтесь к нам в Telegram
              </h3>
              
              <p className="text-sm sm:text-base text-[var(--muted-foreground)] mb-4 max-w-xl">
                Будьте первыми, кто узнает о новых релизах, участвуйте в обсуждениях и получайте эксклюзивный контент.
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-5">
                {TELEGRAM_FEATURES.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--muted-foreground)]"
                  >
                    <feature.icon className="w-3.5 h-3.5 text-[#0088cc]" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://t.me/tomilolib"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold transition-all duration-300 shadow-lg shadow-[#0088cc]/25 hover:shadow-[#0088cc]/40 hover:scale-105 active:scale-100"
              >
                <Send className="w-4 h-4" />
                Подписаться на канал
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
