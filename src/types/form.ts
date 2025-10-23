export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string | null>>;
export type FormTouched<T> = Partial<Record<keyof T, boolean>>;
