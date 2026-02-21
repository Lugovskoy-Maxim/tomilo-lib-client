"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Toast as ToastType } from "@/types/toast";
import { useToastContext } from "@/contexts/ToastContext";

interface ToastProps {
  toast: ToastType;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    progress: "bg-emerald-500",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-red-500/15 text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    progress: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    progress: "bg-amber-500",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    progress: "bg-blue-500",
  },
};

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { removeToast } = useToastContext();
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const duration = toast.duration ?? 5000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration <= 0) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-[var(--card)] text-[var(--card-foreground)]
        shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
        overflow-hidden w-full min-w-0 max-w-[420px] sm:min-w-[320px]
        ${config.border}
      `}
    >
      <div
        className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${config.iconBg}`}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[13px] sm:text-sm font-medium text-[var(--foreground)] leading-snug">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Закрыть"
      >
        <X className="w-4 h-4" />
      </button>

      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--muted)]">
          <div
            className={`h-full transition-[width] duration-75 ease-linear ${config.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToastContext();

  return (
    <div
      className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 sm:left-auto sm:right-4 sm:top-4 z-layer-toast flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Уведомления"
    >
      <div className="flex flex-col gap-3 pointer-events-auto w-full sm:w-auto max-w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ToastContainer;
