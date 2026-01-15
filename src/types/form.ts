

export type FormErrors<T> = Partial<Record<keyof T, string | null>>;
export type FormTouched<T> = Partial<Record<keyof T, boolean>>;

// Re-export for convenience
export type { LoginData, RegisterData } from "./auth";
