interface LoadingSkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Универсальный компонент скелетона загрузки
 */
export default function LoadingSkeleton({
  className = "",
  children,
}: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse bg-[var(--muted)] rounded ${className}`}>
      {children}
    </div>
  );
}
