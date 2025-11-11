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
      <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}
