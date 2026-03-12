import { useToastContext } from "@/contexts/ToastContext";

export const useToast = () => {
  const { addToast } = useToastContext();

  const toast = {
    success: (message: string, duration?: number, options?: { icon?: string }) =>
      addToast("success", message, duration, options),
    error: (message: string, duration?: number, options?: { icon?: string }) =>
      addToast("error", message, duration, options),
    warning: (message: string, duration?: number, options?: { icon?: string }) =>
      addToast("warning", message, duration, options),
    info: (message: string, duration?: number, options?: { icon?: string }) =>
      addToast("info", message, duration, options),
  };

  return toast;
};
