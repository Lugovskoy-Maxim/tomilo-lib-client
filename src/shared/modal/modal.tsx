import { ReactNode } from "react";
import { X } from "lucide-react";
import { useModal } from "@/hooks/useModal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useModal(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md mx-auto bg-[var(--background)] rounded-2xl shadow-xl border border-[var(--border)] max-h-[75dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col mt-12 sm:mt-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-2 border-b border-[var(--border)] bg-[var(--background)] z-10 rounded-t-2xl flex-shrink-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--secondary)] transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
