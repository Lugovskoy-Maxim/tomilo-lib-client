"use client";

import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FolderOpen,
  Upload,
  X,
  BookOpen,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
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
import { Collection, CreateCollectionDto, UpdateCollectionDto } from "@/types/collection";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import { Title } from "@/types/title";
import Modal from "@/shared/modal/modal";
import LoadingSkeleton from "@/shared/skeleton/skeleton";
import { ErrorState as SharedErrorState } from "@/shared/error-state";
import Pagination from "@/shared/browse/pagination";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { getCoverUrls } from "@/lib/asset-url";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

interface CollectionsSectionProps {
  onTabChange?: (tab: string) => void;
}

export function CollectionsSection({}: CollectionsSectionProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [sortBy, setSortBy] = useState<"name" | "views" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTitlesModalOpen, setIsTitlesModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder]);

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

  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();
  const [updateCollection, { isLoading: isUpdating }] = useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] = useDeleteCollectionMutation();
  const [addTitleToCollection, { isLoading: isAddingTitle }] = useAddTitleToCollectionMutation();
  const [removeTitleFromCollection, { isLoading: isRemovingTitle }] =
    useRemoveTitleFromCollectionMutation();
  const [addCommentToCollection, { isLoading: isAddingComment }] =
    useAddCommentToCollectionMutation();
  const [removeCommentFromCollection, { isLoading: isRemovingComment }] =
    useRemoveCommentFromCollectionMutation();

  const collections = collectionsResponse?.data?.collections || [];
  const totalPages = collectionsResponse?.data?.totalPages || 1;
  const total = collectionsResponse?.data?.total || 0;

  const handleCreate = async (data: CreateCollectionDto | FormData) => {
    try {
      await createCollection(data).unwrap();
      setModalContent({
        title: "Успешно",
        message: "Коллекция успешно создана",
      });
      setIsModalOpen(true);
      setIsCreateModalOpen(false);
      refetch();
    } catch {
      setModalContent({
        title: "Ошибка",
        message: "Не удалось создать коллекцию",
      });
      setIsModalOpen(true);
    }
  };

  const handleUpdate = async (data: UpdateCollectionDto | FormData) => {
    if (!selectedCollection) return;
    try {
      const updatedCollection = await updateCollection({
        id: selectedCollection.id,
        data,
      }).unwrap();
      setSelectedCollection(updatedCollection.data || null);
      setModalContent({
        title: "Успешно",
        message: "Коллекция успешно обновлена",
      });
      setIsModalOpen(true);
      setIsEditModalOpen(false);
      refetch();
    } catch {
      setModalContent({
        title: "Ошибка",
        message: "Не удалось обновить коллекцию",
      });
      setIsModalOpen(true);
    }
  };

  const handleEditSubmit = async (data: CreateCollectionDto | FormData) => {
    if (!selectedCollection) return;
    if (data instanceof FormData) {
      // Handle FormData case - send FormData directly
      await handleUpdate(data);
    } else {
      const updateData: UpdateCollectionDto = {
        name: data.name,
        description: data.description,
        cover: data.cover,
      };
      await handleUpdate(updateData);
    }
  };

  const handleCoverUpdate = async (file: File) => {
    if (!selectedCollection) return;
    try {
      const formData = new FormData();
      formData.append("cover", file);
      await updateCollection({
        id: selectedCollection.id,
        data: formData,
      }).unwrap();
      setModalContent({
        title: "Успешно",
        message: "Обложка успешно обновлена",
      });
      setIsModalOpen(true);
      refetch();
    } catch {
      setModalContent({
        title: "Ошибка",
        message: "Не удалось обновить обложку",
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || id === "undefined") {
      console.error("Invalid collection ID for deletion");
      return;
    }
    if (!confirm("Вы уверены, что хотите удалить эту коллекцию?")) return;
    try {
      await deleteCollection(id).unwrap();
      setModalContent({
        title: "Успешно",
        message: "Коллекция успешно удалена",
      });
      setIsModalOpen(true);
      refetch();
    } catch {
      setModalContent({
        title: "Ошибка",
        message: "Не удалось удалить коллекцию",
      });
      setIsModalOpen(true);
    }
  };

  const openEditModal = (collection: Collection) => {
    if (!collection.id) {
      console.error("Collection missing id:", collection);
      return;
    }
    setSelectedCollection(collection);
    setIsEditModalOpen(true);
  };

  const openTitlesModal = (collection: Collection) => {
    if (!collection.id) {
      console.error("Collection missing id:", collection);
      return;
    }
    setSelectedCollection(collection);
    setIsTitlesModalOpen(true);
  };

  const openCommentsModal = (collection: Collection) => {
    if (!collection.id) {
      console.error("Collection missing id:", collection);
      return;
    }
    setSelectedCollection(collection);
    setIsCommentsModalOpen(true);
  };

  const handleAddTitle = async (collectionId: string, titleId: string) => {
    try {
      await addTitleToCollection({ collectionId, titleId }).unwrap();
      setModalContent({
        title: "Успешно",
        message: "Тайтл успешно добавлен в коллекцию",
      });
      setIsModalOpen(true);
      refetch();
    } catch {
      setModalContent({
        title: "Ошибка",
        message: "Не удалось добавить тайтл в коллекцию",
      });
      setIsModalOpen(true);
    }
  };

  const handleRemoveTitle = async (collectionId: string, titleId: string) => {
    try {
      await removeTitleFromCollection({ collectionId, titleId }).unwrap();
      setModalContent({
        title: "Успешно",
        message: "Тайтл успешно удален из коллекции",
      });
      setIsModalOpen(true);
      refetch();
    } catch {
      setModalContent({
        title: "Ошибка",
        message: "Не удалось удалить тайтл из коллекции",
      });
      setIsModalOpen(true);
    }
  };

  const handleAddComment = async (collectionId: string, comment: string) => {
    try {
      await addCommentToCollection({ collectionId, comment }).unwrap();
      setModalContent({
        title: "Успешно",
        message: "Комментарий успешно добавлен",
      });
      setIsModalOpen(true);
      refetch();
    } catch {
      setModalContent({
        title: "Ошибка",
        message: "Не удалось добавить комментарий",
      });
      setIsModalOpen(true);
    }
  };

  const handleRemoveComment = async (collectionId: string, commentIndex: number) => {
    try {
      await removeCommentFromCollection({
        collectionId,
        commentIndex,
      }).unwrap();
      setModalContent({
        title: "Успешно",
        message: "Комментарий успешно удален",
      });
      setIsModalOpen(true);
      refetch();
    } catch {
      setModalContent({
        title: "Ошибка",
        message: "Не удалось удалить комментарий",
      });
      setIsModalOpen(true);
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
            Всего коллекций: {total}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="admin-btn admin-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать коллекцию
        </button>
      </div>

      {/* Results Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalContent?.title || "Результат операции"}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {modalContent?.title === "Ошибка" ? (
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            ) : (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            )}
          </div>
          <p className="text-[var(--muted-foreground)] mb-6">
            {modalContent?.message || "Операция завершена"}
          </p>
          <button
            onClick={() => setIsModalOpen(false)}
            className="admin-btn admin-btn-primary"
          >
            Закрыть
          </button>
        </div>
      </Modal>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск коллекций..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input w-full pl-10 bg-[var(--secondary)] text-[var(--muted-foreground)]"
          />
        </div>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={e => {
            const [field, order] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
            setSortBy(field);
            setSortOrder(order);
          }}
          className="admin-btn admin-btn-secondary"
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
          collections.map((collection: Collection, index: number) => {
            const placeholderSrc = typeof IMAGE_HOLDER === "string" ? IMAGE_HOLDER : IMAGE_HOLDER.src;
            const { primary: coverUrl, fallback: coverFallback } = getCoverUrls(collection.cover, placeholderSrc);
            return (
              <div
                key={`${collection.id}-${index}`}
                className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] overflow-hidden hover:border-[var(--primary)]/50 transition-colors flex flex-col"
              >
                <div className="relative aspect-[3/4] bg-[var(--muted)]">
                  <OptimizedImage
                    src={coverUrl}
                    fallbackSrc={coverFallback}
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-[var(--foreground)] truncate flex-1 pr-2">
                      {collection.name}
                    </h3>
                    <div className="flex gap-1 flex-shrink-0">
                      <Link
                        href={`/collections/${collection.id}`}
                        target="_blank"
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors rounded"
                        title="Открыть на сайте"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openTitlesModal(collection)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors rounded"
                        title="Управление тайтлами"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openCommentsModal(collection)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors rounded"
                        title="Управление комментариями"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(collection)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors rounded"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(collection.id)}
                        disabled={isDeleting}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 transition-colors disabled:opacity-50 rounded"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {collection.description && (
                    <p
                      className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2 flex-1"
                      style={{ minHeight: "2.8em" }}
                    >
                      {collection.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)] mt-auto">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {collection.views} просмотров
                    </span>
                    <span>{collection.titles?.length || 0} тайтлов</span>
                  </div>

                  {collection.createdAt && (
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Создано: {new Date(collection.createdAt).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Страница {page} из {totalPages} • Всего: {total} коллекций
          </p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
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
        onCoverUpdate={handleCoverUpdate}
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
  onSubmit: (data: CreateCollectionDto | FormData) => Promise<void>;
  onCoverUpdate?: (file: File) => Promise<void>;
  isLoading: boolean;
  title: string;
  initialData?: Collection;
}

function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  onCoverUpdate,
  isLoading,
  title,
  initialData,
}: CollectionModalProps) {
  const [formData, setFormData] = useState<CreateCollectionDto>({
    name: "",
    description: "",
    cover: "",
    titles: [],
    comments: [],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        cover: initialData.cover || "",
        titles: initialData.titles || [],
        comments: initialData.comments || [],
      });
      setPreviewUrl(null);
    } else {
      setFormData({
        name: "",
        description: "",
        cover: "",
        titles: [],
        comments: [],
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
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFile) {
      // Handle file upload
      try {
        const formDataToSend = new FormData();
        formDataToSend.append("cover", selectedFile);
        formDataToSend.append("name", formData.name);
        formDataToSend.append("description", formData.description || "");

        // For now, we'll submit with the file - the API will handle it
        await onSubmit(formDataToSend);
      } catch {
        // Handle error silently in production
      }
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof CreateCollectionDto, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const imageCoverUrls = (): { primary: string; fallback: string } => {
    const placeholderSrc = typeof IMAGE_HOLDER === "string" ? IMAGE_HOLDER : IMAGE_HOLDER.src;
    if (previewUrl && previewUrl.startsWith("data:")) return { primary: previewUrl, fallback: previewUrl };
    return getCoverUrls(formData?.cover, placeholderSrc);
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
            onChange={e => handleChange("name", e.target.value)}
            required
            placeholder="Введите название коллекции"
            className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-[var(--admin-radius)] text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Описание
          </label>
          <textarea
            value={formData.description || ""}
            onChange={e => handleChange("description", e.target.value)}
            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-[var(--admin-radius)] text-[var(--muted-foreground)] resize-none"
            rows={3}
            placeholder="Введите описание коллекции"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Изображение обложки
          </label>

          {/* Current/Preview Image */}
          {(previewUrl || formData.cover || selectedFile) && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-[200px] aspect-[2/3] rounded-[var(--admin-radius)] border border-[var(--border)] overflow-hidden bg-[var(--muted)]">
                <OptimizedImage
                  src={imageCoverUrls().primary}
                  fallbackSrc={imageCoverUrls().fallback}
                  alt="Обложка коллекции"
                  fill
                  className="object-cover"
                />
                {selectedFile && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Новое изображение</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="border border-dashed border-[var(--border)] rounded-[var(--admin-radius)] p-4">
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

          {/* Update Cover Button */}
          {onCoverUpdate && selectedFile && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => onCoverUpdate(selectedFile)}
                className="admin-btn admin-btn-primary"
              >
                Обновить только обложку
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-[var(--admin-radius)] hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: titlesResponse, isLoading: isLoadingTitles } = useSearchTitlesQuery(
    {
      search: search || undefined,
      limit: search ? 50 : 100,
      page: 1,
    },
    { skip: !isOpen },
  );

  const { data: collectionDetails, isLoading: isLoadingCollection } = useGetCollectionByIdQuery(
    collection.id,
    { skip: !isOpen },
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const titles = titlesResponse?.data?.data || [];
  const collectionTitles = collectionDetails?.data?.titles || collection.titles || [];

  const availableTitles = titles.filter(
    (title: Title) =>
      !collectionTitles.some(
        (ct: string | Title) =>
          (typeof ct === "string" ? ct : (ct as Title)._id) === title._id,
      ),
  );

  const handleAddTitle = () => {
    if (selectedTitleId) {
      onAddTitle(collection.id, selectedTitleId);
      setSelectedTitleId("");
      setSearch("");
    }
  };

  const handleRemoveTitle = (titleId: string) => {
    onRemoveTitle(collection.id, titleId);
  };

  const getTitleImageUrls = (t: Title) => {
    const placeholderSrc = typeof IMAGE_HOLDER === "string" ? IMAGE_HOLDER : IMAGE_HOLDER.src;
    return getCoverUrls(t.coverImage, placeholderSrc);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Управление тайтлами — ${collection.name}`}>
      <div className="space-y-6">
        {/* Current Titles */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Тайтлы в коллекции ({collectionTitles.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {isLoadingCollection ? (
              <p className="text-sm text-[var(--muted-foreground)]">Загрузка...</p>
            ) : collectionTitles.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Нет тайтлов в коллекции</p>
            ) : (
              collectionTitles.map((title: string | Title) => {
                const titleData = typeof title === "string" ? { _id: title, name: "—", coverImage: undefined } : title;
                return (
                  <div
                    key={titleData._id}
                    className="flex items-center justify-between gap-3 p-2 bg-[var(--secondary)] rounded-[var(--admin-radius)]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-[var(--muted)]">
                        <OptimizedImage
                          src={getTitleImageUrls(titleData as Title).primary}
                          fallbackSrc={getTitleImageUrls(titleData as Title).fallback}
                          alt={titleData.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[var(--foreground)] truncate">{titleData.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveTitle(titleData._id)}
                      disabled={isRemoving}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded disabled:opacity-50 flex-shrink-0"
                      title="Удалить из коллекции"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add Title */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Добавить тайтл
          </h3>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Поиск по названию или автору..."
                className="admin-input w-full pl-10 pr-4"
              />
            </div>
            {showDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-[var(--admin-radius)] shadow-lg max-h-56 overflow-y-auto">
                {isLoadingTitles ? (
                  <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">Загрузка...</div>
                ) : availableTitles.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                    {search ? "Ничего не найдено" : "Введите поисковый запрос"}
                  </div>
                ) : (
                  availableTitles.slice(0, 20).map((title: Title) => (
                    <button
                      key={title._id}
                      type="button"
                      onClick={() => {
                        setSelectedTitleId(title._id);
                        setSearch(title.name);
                        setShowDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-[var(--accent)] border-b border-[var(--border)] last:border-b-0 flex items-center gap-3 ${
                        selectedTitleId === title._id ? "bg-[var(--accent)]" : ""
                      }`}
                    >
                      <div className="relative w-8 h-11 flex-shrink-0 rounded overflow-hidden bg-[var(--muted)]">
                        <OptimizedImage
                          src={getTitleImageUrls(title).primary}
                          fallbackSrc={getTitleImageUrls(title).fallback}
                          alt={title.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--foreground)] truncate">{title.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">
                          {title.author ?? "—"}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {selectedTitleId && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">Выбран:</span>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {availableTitles.find((t: Title) => t._id === selectedTitleId)?.name ?? "—"}
              </span>
              <button
                onClick={handleAddTitle}
                disabled={isAdding}
                className="admin-btn admin-btn-primary text-sm py-1.5"
              >
                {isAdding ? "Добавление..." : "Добавить"}
              </button>
              <button
                onClick={() => {
                  setSelectedTitleId("");
                  setSearch("");
                }}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="admin-btn admin-btn-secondary">
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
      onAddComment(collection.id, newComment.trim());
      setNewComment("");
    }
  };

  const handleRemoveComment = (index: number) => {
    onRemoveComment(collection.id, index);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Управление комментариями - ${collection.name}`}
    >
      <div className="space-y-6">
        {/* Current Comments */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--muted-foreground)] mb-3">
            Комментарии ({comments.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {comments.map((comment, index) => (
              <div
                key={index}
                className="flex justify-between items-start p-3 bg-[var(--secondary)] rounded"
              >
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
              onChange={e => setNewComment(e.target.value)}
              placeholder="Введите комментарий..."
              className="flex-1 px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-[var(--admin-radius)] text-[var(--muted-foreground)] resize-none"
              rows={3}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isAdding}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-[var(--admin-radius)] hover:bg-[var(--primary)]/90 disabled:opacity-50 self-end"
            >
              {isAdding ? "Добавление..." : "Добавить"}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
}
