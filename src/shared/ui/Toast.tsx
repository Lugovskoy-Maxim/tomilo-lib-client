'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast as ToastType } from '@/types/toast';
import { useToastContext } from '@/contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastClasses = {
  success: 'bg-[var(--chart-1)]',
  error: 'bg-[var(--chart-5)]',
  warning: 'bg-[var(--chart-3)]',
  info: 'bg-[var(--chart-2)]',
};

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { removeToast } = useToastContext();
  const Icon = toastIcons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-center p-4 mb-4 text-white rounded-lg shadow-lg max-w-sm ${toastClasses[toast.type]}`}
    >
      <Icon className="w-6 h-6 mr-3 flex-shrink-0" />
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-3 text-white hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToastContext();

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
