"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

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
    <div className="fixed bottom-20 left-4 right-4 bg-[var(--card)]/90 border border-border p-4 shadow-lg rounded-lg z-40 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          Присоединяйтесь к нашей группе в Telegram!
        </p>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={handleJoin}
            className="px-3 py-1 cursor-pointer bg-[var(--primary)]/10 text-[var(--chart-1)]/90 hover:text-[var(--chart-1)]  text-sm rounded hover:bg-[var(--chart-1)]/5 border border-transparent hover:border-[var(--border)] transition-colors"
          >
            Присоединиться
          </button>
          <button
            onClick={handleClose}
            className="absolute -top-3 -right-3 border border-[var(--border)] bg-[var(--muted)] hover:bg-[var(--muted)]/90 rounded-full p-2 cursor-pointer text-[var(--primary)] text-sm hover:text-[var(--chart-5)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramJoinNotification;
