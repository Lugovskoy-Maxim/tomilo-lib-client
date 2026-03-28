import { useToastContext } from "@/contexts/ToastContext";
import type { AddToastOptions } from "@/types/toast";

export const useToast = () => {
  const { addToast } = useToastContext();

  const toast = {
    success: (message: string, duration?: number, options?: AddToastOptions) =>
      addToast("success", message, duration, options),
    error: (message: string, duration?: number, options?: AddToastOptions) =>
      addToast("error", message, duration, options),
    warning: (message: string, duration?: number, options?: AddToastOptions) =>
      addToast("warning", message, duration, options),
    info: (message: string, duration?: number, options?: AddToastOptions) =>
      addToast("info", message, duration, options),
  };

  return toast;
};
