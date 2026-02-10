"use client";

import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";

const TelegramJoinNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem("telegram-notification-shown");
    if (!hasShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("telegram-notification-shown", "true");
    setIsVisible(false);
  };

  const handleJoin = () => {
    window.open("https://t.me/tomilolib", "_blank");
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-fade-in-up  ">
      <div className="bg-[var(--card)] border-2 border-[#0088cc]/30 rounded-xl p-4 shadow-2xl hover-lift relative overflow-hidden">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0088cc]/10 via-transparent to-[#00a8e6]/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-1 right-1 p-2 rounded-full bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200 hover:rotate-90 z-50 shadow-md cursor-pointer"
          aria-label="Закрыть"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex items-start gap-3">
          {/* Telegram Icon */}
          {/* <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#0088cc] to-[#00a8e6] flex items-center justify-center shadow-lg shadow-[#0088cc]/30">
            <Send className="w-5 h-5 text-white" />
          </div> */}

          {/* Content */}
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
              Наш Telegram канал
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-3">
              Получайте уведомления о новых главах, участвуйте в обсуждениях и будьте в курсе всех обновлений!
            </p>
            
            {/* Action button */}
            <button
              onClick={handleJoin}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[#0088cc] to-[#00a8e6] text-white hover:from-[#0099dd] hover:to-[#00b9f7] transition-all duration-200 shadow-lg shadow-[#0088cc]/25 hover:shadow-[#0088cc]/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Присоединиться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramJoinNotification;
