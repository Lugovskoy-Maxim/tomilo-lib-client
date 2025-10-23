import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface InputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  placeholder: string;
  error: string | null | undefined;
  icon: React.ComponentType<{ className?: string }>;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
  required?: boolean;
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
}) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-4 py-2 bg-[var(--secondary)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
            error ? 'border-red-500' : 'border-[var(--border)]'
          }`}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
};

export default Input;