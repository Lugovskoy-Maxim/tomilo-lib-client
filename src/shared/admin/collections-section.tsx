"use client";

import React, { useState, ChangeEvent } from "react";
import { Plus, Search, Edit, Trash2, Eye, FolderOpen, Upload, X, BookOpen, MessageSquare } from "lucide-react";
import {
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useAddTitleToCollectionMutation,
  useRemoveTitleFromCollectionMutation,
  useAddCommentToCollectionMutation,
  useRemoveCommentFromCollectionMutation,
  useGetCollectionByIdQuery,
} from "@/store/api/collectionsApi";
import {
  Collection,
  CreateCollectionDto,
  UpdateCollectionDto,
} from "@/types/collection";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import { Title } from "@/types/title";
import Modal from "@/shared/modal/modal";
import LoadingSkeleton from "@/shared/skeleton";
import SharedErrorState from "@/shared/error-state";
import Image from "next/image";

interface CollectionsSectionProps {
  onTabChange?: (tab: string) => void;
}

export function CollectionsSection({}: CollectionsSectionProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<"name" | "views" | "createdAt">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTitlesModalOpen, setIsTitlesModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);

  const {
    data: collectionsResponse,
    isLoading,
    error,
    refetch,
  } = useGetCollectionsQuery({
    page,
    limit,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const [createCollection, { isLoading: isCreating }] =
    useCreateCollectionMutation();
  const [updateCollection, { isLoading: isUpdating }] =
    useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] =
    useDeleteCollectionMutation();
  const [addTitleToCollection, { isLoading: isAddingTitle }] =
    useAddTitleToCollectionMutation();
  const [removeTitleFromCollection, { isLoading: isRemovingTitle }] =
    useRemoveTitleFromCollectionMutation();
  const [addCommentToCollection, { isLoading: isAddingComment }] =
    useAddCommentToCollectionMutation();
  const [removeCommentFromCollection, { isLoading: isRemovingComment }] =
    useRemoveCommentFromCollectionMutation();

  const collections = collectionsResponse?.data?.collections || [];
  const totalPages = collectionsResponse?.data?.totalPages || 1;

  // Debug logging
  console.log('Collections response:', collectionsResponse);
  console.log('Collections data:', collections);
  console.log('Total collections:', collections.length);
  console.log('Error:', error);

  const handleCreate = async (data: CreateCollectionDto) => {
    try {
      await createCollection(data).unwrap();
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  const handleUpdate = async (data: UpdateCollectionDto) => {
    if (!selectedCollection) return;
    try {
      await updateCollection({ id: selectedCollection._id, data }).unwrap();
      setIsEditModalOpen(false);
      setSelectedCollection(null);
      refetch();
    } catch (error) {
      console.error("Failed to update collection:", error);
    }
  };

  const handleEditSubmit = async (data: CreateCollectionDto) => {
    if (!selectedCollection) return;
    const updateData: UpdateCollectionDto = {
      name: data.name,
      description: data.description,
      image: data.image,
      link: data.link,
    };
    await handleUpdate(updateData);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту коллекцию?")) return;
    try {
      await deleteCollection(id).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  };

  const openEditModal = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsEditModalOpen(true);
  };

  const openTitlesModal = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsTitlesModalOpen(true);
  };

  const openCommentsModal = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsCommentsModalOpen(true);
  };

  const handleAddTitle = async (collectionId: string, titleId: string) => {
    try {
      await addTitleToCollection({ collectionId, titleId }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to add title to collection:", error);
    }
  };

  const handleRemoveTitle = async (collectionId: string, titleId: string) => {
    try {
      await removeTitleFromCollection({ collectionId, titleId }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to remove title from collection:", error);
    }
  };

  const handleAddComment = async (collectionId: string, comment: string) => {
    try {
      await addCommentToCollection({ collectionId, comment }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to add comment to collection:", error);
    }
  };

  const handleRemoveComment = async (collectionId: string, commentIndex: number) => {
    try {
      await removeCommentFromCollection({ collectionId, commentIndex }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to remove comment from collection:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <SharedErrorState
        title="Ошибка загрузки"
        message="Не удалось загрузить коллекции. Попробуйте еще раз."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--muted-foreground)] flex items-center gap-2">
            <FolderOpen className="w-6 h-6" />
            Управление коллекциями
          </h2>
          <p className="text-[var(--muted-foreground)] mt-1">
            Всего коллекций: {collectionsResponse?.data?.total || collections.length || 0}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать коллекцию
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск коллекций..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split("-") as [
              typeof sortBy,
              typeof sortOrder
            ];
            setSortBy(field);
            setSortOrder(order);
          }}
          className="px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)]"
        >
          <option value="createdAt-desc">Сначала новые</option>
          <option value="createdAt-asc">Сначала старые</option>
          <option value="name-asc">По названию (А-Я)</option>
          <option value="name-desc">По названию (Я-А)</option>
          <option value="views-desc">По просмотрам</option>
        </select>
      </div>

      {/* Collections Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collections.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FolderOpen className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[var(--muted-foreground)] mb-2">
              Коллекции не найдены
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Создайте первую коллекцию, нажав кнопку &quot;Создать коллекцию&quot;
            </p>
          </div>
        ) : (
          collections.map((collection: Collection) => (
          <div
            key={collection._id}
            className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 hover:border-[var(--primary)] transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-[var(--muted-foreground)] truncate">
                {collection.name}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => openTitlesModal(collection)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                  title="Управление тайтлами"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openCommentsModal(collection)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                  title="Управление комментариями"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(collection)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(collection._id)}
                  disabled={isDeleting}
                  className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {collection.description && (
              <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                {collection.description}
              </p>
            )}

            <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {collection.views} просмотров
              </span>
              <span>{collection.titles?.length || 0} тайтлов</span>
            </div>

            {collection.createdAt && (
              <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                Создано:{" "}
                {new Date(collection.createdAt).toLocaleDateString("ru-RU")}
              </div>
            )}
          </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-[var(--card)] border border-[var(--border)] rounded disabled:opacity-50"
          >
            Назад
          </button>
          <span className="px-3 py-1 text-[var(--muted-foreground)]">
            {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-[var(--card)] border border-[var(--border)] rounded disabled:opacity-50"
          >
            Далее
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
        title="Создать коллекцию"
      />

      {/* Edit Modal */}
      <CollectionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCollection(null);
        }}
        onSubmit={handleEditSubmit}
        isLoading={isUpdating}
        title="Редактировать коллекцию"
        initialData={selectedCollection || undefined}
      />

      {/* Titles Modal */}
      {selectedCollection && (
        <TitlesModal
          isOpen={isTitlesModalOpen}
          onClose={() => {
            setIsTitlesModalOpen(false);
            setSelectedCollection(null);
          }}
          collection={selectedCollection}
          onAddTitle={handleAddTitle}
          onRemoveTitle={handleRemoveTitle}
          isAdding={isAddingTitle}
          isRemoving={isRemovingTitle}
        />
      )}

      {/* Comments Modal */}
      {selectedCollection && (
        <CommentsModal
          isOpen={isCommentsModalOpen}
          onClose={() => {
            setIsCommentsModalOpen(false);
            setSelectedCollection(null);
          }}
          collection={selectedCollection}
          onAddComment={handleAddComment}
          onRemoveComment={handleRemoveComment}
          isAdding={isAddingComment}
          isRemoving={isRemovingComment}
        />
      )}
    </div>
  );
}

// Collection Modal Component
interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCollectionDto) => void;
  isLoading: boolean;
  title: string;
  initialData?: Collection;
}

function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  initialData,
}: CollectionModalProps) {
  const [formData, setFormData] = useState<CreateCollectionDto>({
    name: "",
    description: "",
    image: "",
    link: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        image: initialData.image || "",
        link: initialData.link || "",
      });
      setPreviewUrl(initialData.image || null);
    } else {
      setFormData({
        name: "",
        description: "",
        image: "",
        link: "",
      });
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  }, [initialData]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFile) {
      // Handle file upload
      setIsUploading(true);
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('cover', selectedFile);
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description || '');
        formDataToSend.append('link', formData.link || '');

        // For now, we'll submit with the file - the API will handle it
        await onSubmit(formDataToSend as unknown as CreateCollectionDto);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsUploading(false);
      }
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (
    field: keyof CreateCollectionDto,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Название *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            placeholder="Введите название коллекции"
            className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Описание
          </label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] resize-none"
            rows={3}
            placeholder="Введите описание коллекции"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Изображение обложки
          </label>

          {/* Current/Preview Image */}
          {(previewUrl || formData.image) && (
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <Image
                  src={previewUrl || formData.image || ""}
                  alt="Cover preview"
                  width={200}
                  height={300}
                  className="rounded-lg border border-[var(--border)]"
                  unoptimized
                />
                {previewUrl && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <span className="text-white font-medium">Предпросмотр</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="border border-dashed border-[var(--border)] rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="collection-cover-upload"
            />
            <label
              htmlFor="collection-cover-upload"
              className="cursor-pointer flex flex-col items-center gap-2 p-4 hover:bg-[var(--accent)]/50 rounded transition-colors"
            >
              <Upload className="w-6 h-6 text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--muted-foreground)]">
                {selectedFile ? selectedFile.name : "Выберите изображение обложки"}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                Нажмите для выбора файла (JPG, PNG, WebP, макс. 5MB)
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Ссылка
          </label>
          <input
            type="text"
            value={formData.link || ""}
            onChange={(e) => handleChange("link", e.target.value)}
            placeholder="/collections/my-collection"
            className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[var(--muted-foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Titles Modal Component
interface TitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  onAddTitle: (collectionId: string, titleId: string) => void;
  onRemoveTitle: (collectionId: string, titleId: string) => void;
  isAdding: boolean;
  isRemoving: boolean;
}

function TitlesModal({
  isOpen,
  onClose,
  collection,
  onAddTitle,
  onRemoveTitle,
  isAdding,
  isRemoving,
}: TitlesModalProps) {
  const [search, setSearch] = useState("");
  const [selectedTitleId, setSelectedTitleId] = useState("");

  const { data: titlesResponse, isLoading: isLoadingTitles } = useSearchTitlesQuery({
    search: search || undefined,
    limit: 50,
  });

  const { data: collectionDetails } = useGetCollectionByIdQuery(collection._id);

  const titles = titlesResponse?.data?.data || [];
  const collectionTitles = collectionDetails?.data?.titles || collection.titles || [];

  const availableTitles = titles.filter(
    (title: Title) => !collectionTitles.some((ct) => (typeof ct === 'string' ? ct : ct._id) === title._id)
  );

  const handleAddTitle = () => {
    if (selectedTitleId) {
      onAddTitle(collection._id, selectedTitleId);
      setSelectedTitleId("");
    }
  };

  const handleRemoveTitle = (titleId: string) => {
    onRemoveTitle(collection._id, titleId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Управление тайтлами - ${collection.name}`}>
      <div className="space-y-6">
        {/* Current Titles */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-3">
            Текущие тайтлы ({collectionTitles.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {collectionTitles.map((title, index) => {
              const titleData = typeof title === 'string' ? { _id: title, name: `Title ${title}` } : title;
              return (
                <div key={titleData._id} className="flex justify-between items-center p-2 bg-[var(--secondary)] rounded">
                  <span className="text-[var(--muted-foreground)]">{titleData.name}</span>
                  <button
                    onClick={() => handleRemoveTitle(titleData._id)}
                    disabled={isRemoving}
                    className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {collectionTitles.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">Нет тайтлов в коллекции</p>
            )}
          </div>
        </div>

        {/* Add Title */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-3">
            Добавить тайтл
          </h3>
          <div className="flex gap-2">
            <select
              value={selectedTitleId}
              onChange={(e) => setSelectedTitleId(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)]"
            >
              <option value="">Выберите тайтл...</option>
              {availableTitles.map((title: Title) => (
                <option key={title._id} value={title._id}>
                  {title.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddTitle}
              disabled={!selectedTitleId || isAdding}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50"
            >
              {isAdding ? "Добавление..." : "Добавить"}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--muted-foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Comments Modal Component
interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  onAddComment: (collectionId: string, comment: string) => void;
  onRemoveComment: (collectionId: string, commentIndex: number) => void;
  isAdding: boolean;
  isRemoving: boolean;
}

function CommentsModal({
  isOpen,
  onClose,
  collection,
  onAddComment,
  onRemoveComment,
  isAdding,
  isRemoving,
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState("");

  const comments = collection.comments || [];

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(collection._id, newComment.trim());
      setNewComment("");
    }
  };

  const handleRemoveComment = (index: number) => {
    onRemoveComment(collection._id, index);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Управление комментариями - ${collection.name}`}>
      <div className="space-y-6">
        {/* Current Comments */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-3">
            Комментарии ({comments.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {comments.map((comment, index) => (
              <div key={index} className="flex justify-between items-start p-3 bg-[var(--secondary)] rounded">
                <p className="text-[var(--muted-foreground)] flex-1">{comment}</p>
                <button
                  onClick={() => handleRemoveComment(index)}
                  disabled={isRemoving}
                  className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">Нет комментариев</p>
            )}
          </div>
        </div>

        {/* Add Comment */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-3">
            Добавить комментарий
          </h3>
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Введите комментарий..."
              className="flex-1 px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] resize-none"
              rows={3}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isAdding}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 disabled:opacity-50 self-end"
            >
              {isAdding ? "Добавление..." : "Добавить"}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--muted-foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
}
