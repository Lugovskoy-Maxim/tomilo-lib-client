import { useToastContext } from "@/contexts/ToastContext";

export const useToast = () => {
  const { addToast } = useToastContext();

  const toast = {
    success: (message: string, duration?: number) => addToast("success", message, duration),
    error: (message: string, duration?: number) => addToast("error", message, duration),
    warning: (message: string, duration?: number) => addToast("warning", message, duration),
    info: (message: string, duration?: number) => addToast("info", message, duration),
  };

  return toast;
};
