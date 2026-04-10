import Image from "next/image";
import BG_IMAGE from "../../../public/404/error.png";

interface ErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
}

/**
 * Компонент для отображения состояния ошибки
 */
export default function ErrorState({
  title = "Произошла ошибка",
  message = "Попробуйте обновить страницу",
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-52 h-52 mx-auto flex items-center justify-center">
        <Image
          src={BG_IMAGE}
          alt=""
          role="presentation"
          className="w-52 h-52 select-none"
          unoptimized
          priority
        />
      </div>
      <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}
