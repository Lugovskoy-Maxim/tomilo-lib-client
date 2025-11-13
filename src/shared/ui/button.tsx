interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "link" | "ghost" | "text" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Button = ({
  variant = "primary",
  size = "lg",
  className,
  children,
  ...props
}: ButtonProps) => {
  // Базовые классы для всех кнопок
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

  // Классы для  вариантов
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 border-muted",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground border-muted",
    link: "text-primary underline-offset-4 hover:underline border-muted" ,
    ghost: "hover:bg-accent hover:text-accent-foreground",
    text: "text-primary hover:bg-accent hover:text-accent-foreground",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  // Классы для размеров
  const sizeClasses = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 py-2 px-4 text-sm",
    lg: "h-11 px-8 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${
        sizeClasses[size]
      } ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
export default Button;
