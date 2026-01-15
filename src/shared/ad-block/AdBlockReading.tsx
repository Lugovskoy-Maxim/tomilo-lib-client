"use client";

import { useEffect } from "react";

// Расширяем глобальный объект Window для поддержки yaContextCb и Ya
declare global {
  interface Window {
    yaContextCb: Array<() => void>;
    Ya: {
      Context: {
        AdvManager: {
          render: (params: { blockId: string; renderTo: string; type?: string }) => void;
        };
      };
    };
  }
}

const AdBlockReading = () => {
  useEffect(() => {
    // Проверяем, что window.yaContextCb существует, иначе создаем
    if (typeof window !== "undefined") {
      window.yaContextCb = window.yaContextCb || [];

      // Добавляем код рекламы в очередь
      window.yaContextCb.push(() => {
        try {
          // Проверяем, что Ya.Context.AdvManager доступен
          if (
            typeof window.Ya !== "undefined" &&
            window.Ya.Context &&
            window.Ya.Context.AdvManager
          ) {
            window.Ya.Context.AdvManager.render({
              blockId: "R-A-17803473-2",
              renderTo: "yandex_rtb_R-A-17803473-2",
              type: "feed",
            });
          } else {
            console.warn("Ya.Context.AdvManager is not available");
          }
        } catch (error) {
          console.error("Error rendering ad:", error);
        }
      });
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-6">
      {/* Yandex.RTB R-A-17803473-2 */}
      <div id="yandex_rtb_R-A-17803473-2" className="w-full max-w-2xl"></div>
    </div>
  );
};

export default AdBlockReading;

