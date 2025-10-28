import { Eye, EyeOff, Mail, Lock, User, LucideIcon } from "lucide-react";
import { useState } from "react";

interface InputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  placeholder: string;
  error: string | null | undefined;
  icon: LucideIcon;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
  required?: boolean;
  className?: string;
  name?: string;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  icon: Icon,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
  required = false,
  className = "",
  name,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur();
  };

  // Автоматическое определение типа для пароля
  const getInputType = () => {
    if (type !== "password") return type;
    return isPasswordVisible ? "text" : "password";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Icon 
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
            error 
              ? "text-red-500" 
              : isFocused 
                ? "text-[var(--primary)]" 
                : "text-[var(--muted-foreground)]"
          }`} 
        />
        <input
          type={getInputType()}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          name={name}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2 bg-[var(--secondary)] border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
            error 
              ? "border-red-500 focus:ring-red-500/20" 
              : isFocused
                ? "border-[var(--primary)] focus:ring-[var(--primary)]"
                : "border-[var(--border)] hover:border-[var(--border-hover)] focus:ring-[var(--primary)]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            disabled={disabled}
          >
            {isPasswordVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      <div className="h-4">
        {error && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {error}
          </span>
        )}
      </div>
    </div>
  );
};

export default Input;