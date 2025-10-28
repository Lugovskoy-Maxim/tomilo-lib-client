// shared/EditAvatarButton.tsx
"use client";

import { useRef, useState } from 'react';
import { Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
};

interface EditAvatarButtonProps {
  onAvatarUpdate?: (newAvatarUrl: string) => void;
}

function EditAvatarButton({ onAvatarUpdate }: EditAvatarButtonProps) {
  const { user, updateUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }

    // Проверка размера файла (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Размер файла не должен превышать 2MB');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_CONFIG.baseUrl}/users/profile/avatar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tomilo_lib_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при загрузке аватара');
      }

      const updatedUser = await response.json();
      
      // Обновляем пользователя в контексте аутентификации
      if (updateUser) {
        updateUser(updatedUser);
      }

      // Вызываем callback если передан
      if (onAvatarUpdate) {
        onAvatarUpdate(updatedUser.avatar);
      }

      alert('Аватар успешно обновлен!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert(`Ошибка при обновлении аватара: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      // Сбрасываем значение input чтобы можно было выбрать тот же файл снова
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--background)] hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Изменить аватар"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Edit className="w-4 h-4" />
        )}
      </button>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={isLoading}
      />
    </>
  );
}

export default EditAvatarButton;