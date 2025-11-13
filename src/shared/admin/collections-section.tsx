"use client";

import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, FolderOpen } from "lucide-react";
import { useGetCollectionsQuery, useCreateCollectionMutation, useUpdateCollectionMutation, useDeleteCollectionMutation } from "@/store/api/collectionsApi";
import { Collection, CreateCollectionDto, UpdateCollectionDto } from "@/types/collection";
import Modal from "@/shared/modal/modal";
import LoadingSkeleton from "@/shared/loading-skeleton";
import SharedErrorState from "@/shared/error-state";

interface CollectionsSectionProps {
  onTabChange?: (tab: string) => void;
}

export function CollectionsSection({ onTabChange }: CollectionsSectionProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<'name' | 'views' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const { data: collectionsResponse, isLoading, error, refetch } = useGetCollectionsQuery({
    page,
    limit,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();
  const [updateCollection, { isLoading: isUpdating }] = useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] = useDeleteCollectionMutation();

  const collections = collectionsResponse?.data?.collections || [];
  const totalPages = collectionsResponse?.data?.totalPages || 1;

  const handleCreate = async (data: CreateCollectionDto) => {
    try {
      await createCollection(data).unwrap();
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to create collection:', error);
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
      console.error('Failed to update collection:', error);
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
    if (!confirm('Вы уверены, что хотите удалить эту коллекцию?')) return;
    try {
      await deleteCollection(id).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const openEditModal = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsEditModalOpen(true);
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
    return <SharedErrorState title="Ошибка загрузки" message="Не удалось загрузить коллекции. Попробуйте еще раз." />;
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
            Всего коллекций: {collectionsResponse?.data?.total || 0}
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
            const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
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
        {collections.map((collection) => (
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
              <span>
                {collection.titles?.length || 0} тайтлов
              </span>
            </div>

            {collection.createdAt && (
              <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                Создано: {new Date(collection.createdAt).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
        ))}
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

function CollectionModal({ isOpen, onClose, onSubmit, isLoading, title, initialData }: CollectionModalProps) {
  const [formData, setFormData] = useState<CreateCollectionDto>({
    name: '',
    description: '',
    image: '',
    link: '',
    titles: [],
    comments: [],
  });

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        image: initialData.image || '',
        link: initialData.link || '',
        titles: initialData.titles || [],
        comments: initialData.comments || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image: '',
        link: '',
        titles: [],
        comments: [],
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateCollectionDto, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            onChange={(e) => handleChange('name', e.target.value)}
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
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] resize-none"
            rows={3}
            placeholder="Введите описание коллекции"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Изображение (URL)
          </label>
          <input
            type="url"
            value={formData.image || ''}
            onChange={(e) => handleChange('image', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Ссылка
          </label>
          <input
            type="text"
            value={formData.link || ''}
            onChange={(e) => handleChange('link', e.target.value)}
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
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
