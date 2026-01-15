"use client";

import { useState } from "react";
import Button from "@/shared/ui/button";
import Input from "@/shared/ui/input";
import { Trash2, Search } from "lucide-react";
import { useGetCommentsQuery, useDeleteCommentMutation } from "@/store/api/commentsApi";
import { Comment, CommentEntityType } from "@/types/comment";

export function CommentsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entityType, setEntityType] = useState<CommentEntityType | "all">("all");

  // Получаем все комментарии
  const { data, isLoading, isError, refetch } = useGetCommentsQuery({
    entityType: CommentEntityType.TITLE,
    entityId: "all", // Заглушка, так как мы хотим получить все комментарии
    page: currentPage,
    limit: 20,
    includeReplies: true,
  });

  const [deleteComment] = useDeleteCommentMutation();

  // Обработчик удаления комментария
  const handleDeleteComment = async (id: string) => {
    try {
      await deleteComment(id).unwrap();
      refetch();
    } catch (error) {
      console.error("Ошибка при удалении комментария:", error);
    }
  };

  // Фильтрация комментариев по поисковому запросу
  const filteredComments =
    data?.data?.comments.filter(
      (comment: Comment) =>
        comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof comment.userId !== "string" &&
          comment.userId.username.toLowerCase().includes(searchTerm.toLowerCase())),
    ) || [];

  if (isLoading) {
    return <div className="text-center py-8">Загрузка комментариев...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-500">Ошибка загрузки комментариев</div>;
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Комментарии</h2>
        <p className="text-[var(--muted-foreground)]">Управление комментариями пользователей</p>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <Input
            type="text"
            placeholder="Поиск комментариев..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        <select
          value={entityType}
          onChange={e => setEntityType(e.target.value as CommentEntityType | "all")}
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
        >
          <option value="all">Все типы</option>
          <option value={CommentEntityType.TITLE}>Тайтлы</option>
          <option value={CommentEntityType.CHAPTER}>Главы</option>
        </select>
      </div>

      {/* Список комментариев */}
      <div className="space-y-4">
        {filteredComments.length > 0 ? (
          filteredComments.map((comment: Comment) => (
            <div
              key={comment._id}
              className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-[var(--foreground)]">
                    {typeof comment.userId !== "string" ? comment.userId.username : "Пользователь"}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[var(--foreground)] mb-2">{comment.content}</p>
              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                <span>Тип: {comment.entityType}</span>
                <span>Лайки: {comment.likes}</span>
                <span>Дизлайки: {comment.dislikes}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            Комментарии не найдены
          </div>
        )}
      </div>

      {/* Пагинация */}
      {data?.data && data.data.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            {Array.from({ length: data.data.totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "outline"}
                onClick={() => setCurrentPage(page)}
                className={
                  currentPage === page ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : ""
                }
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
