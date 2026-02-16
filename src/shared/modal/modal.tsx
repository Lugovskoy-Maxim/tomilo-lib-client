"use client"

import { ReactNode, useState, useEffect } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useModal } from "@/hooks/useModal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const pathname = usePathname();
  const modalRef = useModal(isOpen, onClose);
  const [portalReady, setPortalReady] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  useEffect(() => {
    if (pathname !== lastPathname) {
      setLastPathname(pathname);
      if (isOpen) onClose();
    }
  }, [pathname, lastPathname, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPortalReady(false);
      return;
    }
    const t = requestAnimationFrame(() => setPortalReady(true));
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;
  if (!portalReady) return null;

  return (
    <div
      data-modal-portal
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-2 min-[360px]:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-full sm:max-w-md mx-auto bg-[var(--background)] rounded-xl sm:rounded-2xl shadow-xl border border-[var(--border)] max-h-[85dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col mt-8 sm:mt-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-2 min-[360px]:p-3 border-b border-[var(--border)] bg-[var(--background)] z-10 rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
          <h2 className="text-sm min-[360px]:text-base sm:text-lg truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--secondary)] transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 min-[360px]:p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
