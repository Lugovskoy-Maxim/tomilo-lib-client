"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { Toast, ToastContextType } from "@/types/toast";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIdsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    if (timeoutIdsRef.current.has(id)) {
      clearTimeout(timeoutIdsRef.current.get(id));
      timeoutIdsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (type: Toast["type"], message: string, duration = 5000, options?: { icon?: string }) => {
      const id = Date.now().toString();
      const toast: Toast = { id, type, message, duration, icon: options?.icon };

      setToasts(prev => [...prev, toast]);

      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          timeoutIdsRef.current.delete(id);
          removeToast(id);
        }, duration);
        timeoutIdsRef.current.set(id, timeoutId);
      }
    },
    [removeToast],
  );

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.clear();
    };
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};
