import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProfileQuery } from '@/store/api/authApi'; // Изменили импорт
import { login, logout, setLoading } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { AuthResponse, StoredUser } from '@/types/auth';

// Сохраняем ваши существующие ключи
const AUTH_TOKEN_KEY = "tomilo_lib_token";
const USER_DATA_KEY = "tomilo_lib_user";

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  
  // Получаем токен для проверки
  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

  // Автоматически проверяем авторизацию при монтировании, если есть токен
  const { data: user, isLoading, error } = useGetProfileQuery(undefined, { // Используем новый хук
    skip: !token, // Пропускаем если нет токена
  });

  useEffect(() => {
    dispatch(setLoading(isLoading));
  }, [isLoading, dispatch]);

  // При успешной проверке авторизации обновляем состояние
  useEffect(() => {
    if (user && token) {
      const authResponse: AuthResponse = {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
      dispatch(login(authResponse));
    }
  }, [user, token, dispatch]);

  // При ошибке проверки авторизации разлогиниваемся
  useEffect(() => {
    if (error && token) {
      console.error('Auth check failed:', error);
      
      // Проверяем, что это именно ошибка авторизации (404 или 401), а не сетевые проблемы
      if ('status' in error && (error.status === 401 || error.status === 404)) {
        dispatch(logout());
      }
    }
  }, [error, token, dispatch]);

  // Ваши существующие функции (адаптированные для Redux)
  const loginUser = (authResponse: AuthResponse) => {
    dispatch(login(authResponse));
  };

  const logoutUser = () => {
    dispatch(logout());
  };

  return {
    user: auth.user,
    isLoading: auth.isLoading,
    login: loginUser,
    logout: logoutUser,
    isAuthenticated: auth.isAuthenticated,
  };
};