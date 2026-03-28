export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  /** URL картинки предмета — показывается вместо стандартной иконки (для тостов «Получен предмет») */
  icon?: string;
  /** Кнопка действия (например «Перейти» к комментарию из WS-уведомления) */
  actionLabel?: string;
  onAction?: () => void;
}

export type AddToastOptions = {
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number, options?: AddToastOptions) => void;
  removeToast: (id: string) => void;
}
