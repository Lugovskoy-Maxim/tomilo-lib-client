"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, X } from "lucide-react";
import { ExpGainEvent } from "@/types/progress";

interface ExpGainToastProps {
  event: ExpGainEvent;
  onClose: () => void;
  duration?: number;
}

export default function ExpGainToast({ 
  event, 
  onClose, 
  duration = 3000 
}: ExpGainToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, event.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="
        relative flex items-center gap-3 px-4 py-3 rounded-xl 
        bg-[var(--card)] bg-gradient-to-r from-yellow-500/25 to-orange-500/25
        border border-yellow-500/40 shadow-lg shadow-yellow-500/20
        backdrop-blur-sm
        min-w-[200px] max-w-[320px]
      "
    >
      {/* Icon */}
      <motion.div
        initial={{ rotate: -30, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-md"
      >
        <Zap className="w-4 h-4 text-white" fill="white" />
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm font-bold text-yellow-500"
        >
          +{event.amount} XP
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-[var(--muted-foreground)] truncate"
        >
          {event.reason}
        </motion.p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        aria-label="Закрыть"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r from-yellow-500 to-orange-500"
      />
    </motion.div>
  );
}

interface GroupedExpGainToastProps {
  events: ExpGainEvent[];
  onClose: () => void;
  duration?: number;
}

export function GroupedExpGainToast({ 
  events, 
  onClose, 
  duration = 4000 
}: GroupedExpGainToastProps) {
  const totalAmount = events.reduce((sum, e) => sum + e.amount, 0);
  const eventsKey = events.map(e => e.id).join(",");

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, eventsKey]);

  if (events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="
        relative flex items-center gap-3 px-4 py-3 rounded-xl 
        bg-[var(--card)] bg-gradient-to-r from-yellow-500/25 to-orange-500/25
        border border-yellow-500/40 shadow-lg shadow-yellow-500/20
        backdrop-blur-sm
        min-w-[200px] max-w-[320px]
      "
    >
      {/* Icon with count badge */}
      <motion.div
        initial={{ rotate: -30, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        className="relative flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-md"
      >
        <Zap className="w-4 h-4 text-white" fill="white" />
        {events.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--background)] border border-yellow-500/50 text-[9px] font-bold text-yellow-500 flex items-center justify-center">
            {events.length}
          </span>
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm font-bold text-yellow-500"
        >
          +{totalAmount} XP
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-[var(--muted-foreground)] truncate"
        >
          {events.length === 1 
            ? events[0].reason 
            : `${events.length} начислений`}
        </motion.p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        aria-label="Закрыть"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r from-yellow-500 to-orange-500"
      />
    </motion.div>
  );
}
