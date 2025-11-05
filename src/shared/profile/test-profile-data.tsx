"use client";

import { useState, useEffect } from "react";
import BookmarksSection from "@/widgets/profile-bookmarks/profile-bookmarks";
import ReadingHistorySection from "@/widgets/profile-reading/profile-reading";
import { Title, TitleStatus } from "@/types/title";

// Моковые данные для тестирования
const mockTitles: Title[] = [
  {
    _id: "1",
    name: "Тестовый тайтл 1",
    coverImage: "/test-image-1.jpg",
    genres: ["Романтика", "Драма"],
    tags: [],
    description: "Описание тестового тайтла 1",
    status: TitleStatus.COMPLETED,
    totalChapters: 25,
    views: 1000,
    rating: 4.5,
    releaseYear: 2020,
    ageLimit: 16,
    isPublished: true,
  },
  {
    _id: "2",
    name: "Тестовый тайтл 2",
    coverImage: "/test-image-2.jpg",
    genres: ["Экшен", "Приключения"],
    tags: [],
    description: "Описание тестового тайтла 2",
    status: TitleStatus.ONGOING,
    totalChapters: 15,
    views: 2000,
    rating: 4.2,
    releaseYear: 2021,
    ageLimit: 18,
    isPublished: true,
  },
  {
    _id: "3",
    name: "Тестовый тайтл 3",
    coverImage: "/test-image-3.jpg",
    genres: ["Комедия", "Сёнен"],
    tags: [],
    description: "Описание тестового тайтла 3",
    status: TitleStatus.COMPLETED,
    totalChapters: 10,
    views: 1500,
    rating: 4.0,
    releaseYear: 2019,
    ageLimit: 16,
    isPublished: true,
  },
  {
    _id: "4",
    name: "Тестовый тайтл 4",
    coverImage: "/test-image-4.jpg",
    genres: ["Меха", "Научная фантастика"],
    tags: [],
    description: "Описание тестового тайтла 4",
    status: TitleStatus.ONGOING,
    totalChapters: 30,
    views: 3000,
    rating: 4.7,
    releaseYear: 2022,
    ageLimit: 18,
    isPublished: true,
  },
  {
    _id: "5",
    name: "Тестовый тайтл 5",
    coverImage: "/test-image-5.jpg",
    genres: ["Ужасы", "Мистика"],
    tags: [],
    description: "Описание тестового тайтла 5",
    status: TitleStatus.COMPLETED,
    totalChapters: 12,
    views: 800,
    rating: 3.8,
    releaseYear: 2018,
    ageLimit: 18,
    isPublished: true,
  },
];

const mockReadingHistory: Array<{ titleId: string; chapters: Array<{ chapterId: string; readAt: string }> }> = [
  {
    titleId: "1",
    chapters: [
      { chapterId: "101", readAt: new Date().toISOString() }
    ]
  },
  {
    titleId: "2",
    chapters: [
      { chapterId: "201", readAt: new Date().toISOString() }
    ]
  },
  {
    titleId: "3",
    chapters: [
      { chapterId: "301", readAt: new Date().toISOString() }
    ]
  },
  {
    titleId: "4",
    chapters: [
      { chapterId: "401", readAt: new Date().toISOString() }
    ]
  },
  {
    titleId: "5",
    chapters: [
      { chapterId: "501", readAt: new Date().toISOString() }
    ]
  },
];

export default function TestProfileData() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readingHistory, setReadingHistory] = useState<Array<{ titleId: string; chapters: Array<{ chapterId: string; readAt: string }> }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Имитируем загрузку данных
    setTimeout(() => {
      setBookmarks(mockTitles.map(title => title._id));
      setReadingHistory(mockReadingHistory);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <div>Загрузка тестовых данных...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Тестирование закладок</h2>
        <BookmarksSection 
          bookmarks={bookmarks}
        />
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Тестирование истории чтения</h2>
        <ReadingHistorySection 
          readingHistory={readingHistory}
        />
      </div>
    </div>
  );
}