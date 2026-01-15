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

const AdBlock = () => {
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
              blockId: "R-A-17803473-1",
              renderTo: "yandex_rtb_R-A-17803473-1",
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
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Yandex.RTB R-A-17803473-1 */}
      <div id="yandex_rtb_R-A-17803473-1" className="w-full"></div>
    </div>
  );
};

export default AdBlock;
