"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useModal } from "@/hooks/useModal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const ANIMATION_OUT_MS = 200;

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const pathname = usePathname();
  const modalRef = useModal(isOpen, onClose);
  const [lastPathname, setLastPathname] = useState(pathname);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (pathname !== lastPathname) {
      setLastPathname(pathname);
      if (isOpen) onClose();
    }
  }, [pathname, lastPathname, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      setIsClosing(false);
      return;
    }
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    if (!isVisible) {
      onClose();
      return;
    }
    setIsClosing(true);
    const t = setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, ANIMATION_OUT_MS);
    return () => clearTimeout(t);
  }, [isVisible, onClose, isClosing]);

  if (!isOpen) return null;

  const backdropClass = [
    "fixed inset-0 z-layer-modal flex items-start sm:items-center justify-center p-1 min-[360px]:p-2 sm:p-4 overflow-y-auto",
    "bg-black/55 backdrop-blur-md modal-backdrop",
    isClosing && "modal-closing",
  ]
    .filter(Boolean)
    .join(" ");

  const contentClass = [
    "relative w-full max-w-[calc(100%-0.5rem)] min-[360px]:max-w-[calc(100%-1rem)] sm:max-w-md mx-auto bg-[var(--background)] rounded-xl min-[360px]:rounded-2xl shadow-2xl border border-[var(--border)]",
    "max-h-[92dvh] min-[360px]:max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col",
    "mt-4 min-[360px]:mt-6 sm:mt-0 modal-content",
    isClosing && "modal-closing",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      data-modal-portal
      className={backdropClass}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={contentClass}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 min-[360px]:gap-3 px-3 min-[360px]:px-4 sm:px-5 py-2.5 min-[360px]:py-3.5 border-b border-[var(--border)] bg-[var(--background)] flex-shrink-0">
          <h2
            id="modal-title"
            className="text-sm min-[360px]:text-base sm:text-lg font-semibold text-[var(--foreground)] truncate"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex-shrink-0 p-2 min-[360px]:p-2.5 rounded-lg min-[360px]:rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--chart-1)]/40 focus:ring-offset-2 focus:ring-offset-[var(--background)]"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5" />
          </button>
        </div>
        <div className="p-3 min-[360px]:p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
