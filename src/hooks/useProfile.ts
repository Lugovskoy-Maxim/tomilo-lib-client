import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import { pageTitle } from "@/lib/page-title";

const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  basePublicUrl: process.env.NEXT_PUBLIC_URL || 'http://localhost:3001',
};

interface BackendUserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  bookmarks: string[];
  readingHistory: Array<{
    title: string;
    chapter: string;
    date: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

function transformBackendProfile(backendProfile: BackendUserProfile | null): UserProfile | null {
  if (!backendProfile) return null;

  return {
    _id: backendProfile._id,
    username: backendProfile.username,
    email: backendProfile.email,
    avatar: backendProfile.avatar || "",
    role: backendProfile.role,
    bookmarks: backendProfile.bookmarks || [],
    readingHistory: backendProfile.readingHistory || [],
    createdAt: backendProfile.createdAt,
    updatedAt: backendProfile.updatedAt,
  };
}

export function useProfile() {
  const { user, updateUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка данных профиля
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('tomilo_lib_token');
        if (!token) {
          console.error('No token found');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_CONFIG.baseUrl}/users/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const backendProfile: BackendUserProfile = await response.json();
          setUserProfile(transformBackendProfile(backendProfile));
        } else {
          console.error('Failed to load user profile');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Обработчик обновления аватара
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setUserProfile(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
    if (user) {
      updateUser({ ...user, avatar: newAvatarUrl });
    }
  };

  // Устанавливаем заголовок страницы
  useEffect(() => {
    if (userProfile) {
      pageTitle.setTitlePage(`Профиль ${userProfile.username}`);
    } else {
      pageTitle.setTitlePage("Профиль пользователя");
    }
  }, [userProfile]);

  return {
    userProfile,
    isLoading,
    authLoading: !user,
    handleAvatarUpdate,
  };
}