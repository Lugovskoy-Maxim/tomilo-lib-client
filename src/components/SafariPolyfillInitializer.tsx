"use client";

import { useEffect } from "react";
import { initSafariPolyfills } from "@/lib/safari-polyfills";

/**
 * Компонент для инициализации полифиллов и фиксов для Safari
 * Работает только на клиенте
 */
export function SafariPolyfillInitializer() {
  useEffect(() => {
    // Инициализируем полифиллы для Safari
    initSafariPolyfills();
    
    // Дополнительные фиксы для Safari
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium");
      
      if (isSafari) {
        // Фикс для проблем с изображениями в Safari
        const fixSafariImages = () => {
          // Исправляем загрузку изображений с data-src
          document.querySelectorAll('img[data-src]').forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
              const newImg = new Image();
              newImg.onload = () => {
                img.setAttribute('src', src);
                img.removeAttribute('data-src');
              };
              newImg.src = src;
            }
          });
          
          // Исправляем background-image в Safari
          document.querySelectorAll('[style*="background-image"]').forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('url(')) {
              // Принудительно перезагружаем background-image
              const htmlEl = el as HTMLElement;
              // Сохраняем текущее значение и переустанавливаем
              const currentBg = htmlEl.style.backgroundImage;
              htmlEl.style.backgroundImage = 'none';
              setTimeout(() => {
                htmlEl.style.backgroundImage = currentBg;
              }, 10);
            }
          });
        };
        
        // Запускаем фикс после загрузки DOM
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', fixSafariImages);
        } else {
          fixSafariImages();
        }
        
        // Фикс для viewport на iOS
        if (ua.includes('iphone') || ua.includes('ipad')) {
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          if (viewportMeta) {
            let content = viewportMeta.getAttribute('content') || '';
            if (!content.includes('maximum-scale')) {
              content += ', maximum-scale=1';
              viewportMeta.setAttribute('content', content);
            }
          }
        }
      }
    }
  }, []);

  return null; // Этот компонент не рендерит ничего видимого
}

export default SafariPolyfillInitializer;