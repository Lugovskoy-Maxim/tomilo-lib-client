export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export interface StoredUser {
  id: string;
  email: string;
  username: string;
  token: string;
}

// Ключи для localStorage
const AUTH_TOKEN_KEY = 'tomilo-lib_token';
const USER_DATA_KEY = 'tomilo-lib_user';

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`https://tomilo-lib.ru/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Ошибка входа");
    return response.json();
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(`https://tomilo-lib.ru/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Ошибка регистрации");
    return response.json();
  }
};

// Функции для работы с localStorage
export const authStorage = {
  // Сохранение данных пользователя
  saveUser: (authResponse: AuthResponse): void => {
    const userData: StoredUser = {
      id: authResponse.user.id,
      email: authResponse.user.email,
      username: authResponse.user.username,
      token: authResponse.access_token
    };
    
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    localStorage.setItem(AUTH_TOKEN_KEY, authResponse.access_token);
  },

  // Получение данных пользователя
  getUser: (): StoredUser | null => {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  },

  // Получение токена
  getToken: (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Проверка авторизации
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Выход (очистка данных)
  clear: (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },

  // Обновление данных пользователя
  updateUser: (updates: Partial<StoredUser>): void => {
    const currentUser = authStorage.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
    }
  }
};