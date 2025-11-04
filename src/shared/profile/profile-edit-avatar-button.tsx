// shared/EditAvatarButton.tsx
"use client";

import { useRef, useState } from 'react';
import { Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EditAvatarButtonProps {
  onAvatarUpdate?: (newAvatarUrl: string) => void;
}

function EditAvatarButton({ onAvatarUpdate }: EditAvatarButtonProps) {
  const { updateAvatar, refetchProfile } = useAuth();
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
      // Используем хук useAuth для обновления аватара
      const result = await updateAvatar(file);
      
      if (result.success) {
        // Перезапрашиваем профиль для получения актуальных данных
        await refetchProfile();
        
        alert('Аватар успешно обновлен!');
      } else {
        throw new Error(result.error || 'Ошибка при обновлении аватара');
      }
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
        className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--primary-foreground)] text-[var(--primary)] rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--background)] hover:bg-[var(--chart-5)]/60 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
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