export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  /** URL картинки предмета — показывается вместо стандартной иконки (для тостов «Получен предмет») */
  icon?: string;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number, options?: { icon?: string }) => void;
  removeToast: (id: string) => void;
}
