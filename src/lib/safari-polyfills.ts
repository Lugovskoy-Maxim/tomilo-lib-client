/**
 * Полифиллы и фиксы для совместимости с Safari
 */

/**
 * Проверяет, является ли браузер Safari (включая мобильный)
 */
export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    ua.includes('safari') &&
    !ua.includes('chrome') &&
    !ua.includes('chromium') &&
    !ua.includes('edge')
  );
}

/**
 * Проверяет, является ли браузер iOS Safari
 */
export function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) &&
    ua.includes('safari') &&
    !ua.includes('chrome') &&
    !ua.includes('crios')
  );
}

/**
 * Полифилл для IntersectionObserver (базовый)
 * Используется только если нативный IntersectionObserver недоступен
 */
export function ensureIntersectionObserver(): void {
  if (typeof window === 'undefined') return;
  
  if ('IntersectionObserver' in window &&
      'IntersectionObserverEntry' in window &&
      'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
    return; // Нативный Observer доступен
  }
  
  // Базовая имплементация полифилла (упрощенная)
  // В реальном проекте лучше использовать готовый полифилл
  console.warn('IntersectionObserver не поддерживается, используем упрощенную реализацию');
  
  class PolyfillIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number>;
    readonly scrollMargin: string; // Нестандартное свойство, но добавляем для совместимости
    
    private callback: IntersectionObserverCallback;
    private observedElements: Set<Element>;
    private animationFrameId: number | null = null;
    
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      this.root = options?.root ?? null;
      this.rootMargin = options?.rootMargin ?? '0px';
      this.thresholds = Array.isArray(options?.threshold)
        ? options!.threshold
        : (options?.threshold != null ? [options.threshold] : [0]);
      this.scrollMargin = ''; // Не поддерживается в полифилле
      this.observedElements = new Set();
      
      this.checkIntersections = this.checkIntersections.bind(this);
    }
    
    private checkIntersections(): void {
      const entries: IntersectionObserverEntry[] = [];
      
      this.observedElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const isVisible = (
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
          rect.bottom >= 0 &&
          rect.right >= 0
        );
        
        if (isVisible) {
          entries.push({
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: rect,
            intersectionRect: rect,
            rootBounds: null,
            target: element,
            time: performance.now()
          } as IntersectionObserverEntry);
        }
      });
      
      if (entries.length > 0) {
        this.callback(entries, this);
      }
      
      if (this.observedElements.size > 0) {
        this.animationFrameId = requestAnimationFrame(this.checkIntersections);
      }
    }
    
    observe(element: Element): void {
      if (this.observedElements.has(element)) return;
      
      this.observedElements.add(element);
      
      if (this.animationFrameId === null) {
        this.animationFrameId = requestAnimationFrame(this.checkIntersections);
      }
    }
    
    unobserve(element: Element): void {
      this.observedElements.delete(element);
      
      if (this.observedElements.size === 0 && this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
    
    disconnect(): void {
      this.observedElements.clear();
      
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
    
    takeRecords(): IntersectionObserverEntry[] {
      // В упрощенной реализации возвращаем пустой массив
      return [];
    }
  }
  
  // Присваиваем глобальному объекту с приведением типа
  (window as unknown as Window & { IntersectionObserver: typeof PolyfillIntersectionObserver }).IntersectionObserver = PolyfillIntersectionObserver;
  
  class PolyfillIntersectionObserverEntry implements IntersectionObserverEntry {
    readonly isIntersecting: boolean;
    readonly intersectionRatio: number;
    readonly boundingClientRect: DOMRectReadOnly;
    readonly intersectionRect: DOMRectReadOnly;
    readonly rootBounds: DOMRectReadOnly | null;
    readonly target: Element;
    readonly time: number;
    
    constructor(
      isIntersecting: boolean,
      intersectionRatio: number,
      boundingClientRect: DOMRectReadOnly,
      intersectionRect: DOMRectReadOnly,
      rootBounds: DOMRectReadOnly | null,
      target: Element,
      time: number
    ) {
      this.isIntersecting = isIntersecting;
      this.intersectionRatio = intersectionRatio;
      this.boundingClientRect = boundingClientRect;
      this.intersectionRect = intersectionRect;
      this.rootBounds = rootBounds;
      this.target = target;
      this.time = time;
    }
  }
  
  (window as unknown as Window & { IntersectionObserverEntry: typeof PolyfillIntersectionObserverEntry }).IntersectionObserverEntry = PolyfillIntersectionObserverEntry;
}

/**
 * Фикс для проблем с загрузкой изображений в Safari
 * Safari может некорректно обрабатывать некоторые форматы изображений
 */
export function fixSafariImageLoading(): void {
  if (typeof window === 'undefined' || !isSafari()) return;
  
  // Добавляем обработчик для исправления загрузки изображений
  document.addEventListener('DOMContentLoaded', () => {
    // Исправляем для всех img элементов с data-src
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        // Принудительная перезагрузка изображения
        const newImg = new Image();
        newImg.onload = () => {
          img.setAttribute('src', src);
          img.removeAttribute('data-src');
        };
        newImg.src = src;
      }
    });
  });
}

/**
 * Инициализирует все полифиллы для Safari
 */
export function initSafariPolyfills(): void {
  if (typeof window === 'undefined') return;
  
  ensureIntersectionObserver();
  fixSafariImageLoading();
  
  // Дополнительные фиксы для iOS Safari
  if (isIosSafari()) {
    // Фикс для viewport на iOS
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      let content = viewportMeta.getAttribute('content') || '';
      if (!content.includes('maximum-scale')) {
        content += ', maximum-scale=1';
        viewportMeta.setAttribute('content', content);
      }
    }
    
    // Предотвращаем масштабирование при фокусе на input
    document.addEventListener('touchstart', (e) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') {
        (e.target as HTMLElement).style.fontSize = '16px';
      }
    }, { passive: true });
  }
}

const safariPolyfills = {
  isSafari,
  isIosSafari,
  ensureIntersectionObserver,
  fixSafariImageLoading,
  initSafariPolyfills
};

export default safariPolyfills;