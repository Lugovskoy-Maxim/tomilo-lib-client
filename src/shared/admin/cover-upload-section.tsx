import React, { useState, ChangeEvent } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useUpdateTitleMutation } from "@/store/api/titlesApi";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";

interface CoverUploadSectionProps {
  titleId: string;
  currentCover?: string;
  onCoverUpdate: (newCoverUrl: string) => void;
}

export function CoverUploadSection({ titleId, currentCover, onCoverUpdate }: CoverUploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [updateTitle] = useUpdateTitleMutation();
  const toast = useToast();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Создаем превью изображения
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Пожалуйста, выберите изображение для загрузки");
      return;
    }

    setIsUploading(true);
    try {
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('coverImage', selectedFile);

      // Отправляем запрос на обновление обложки
      const result = await updateTitle({
        id: titleId,
        data: formData as unknown as Partial<{ coverImage: string }>,
        hasFile: true
      }).unwrap();

      if (result.data?.coverImage) {
        onCoverUpdate(result.data.coverImage);
        toast.success("Обложка успешно обновлена!");
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Error updating cover:", error);
      toast.error("Ошибка при обновлении обложки");
    } finally {
      setIsUploading(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_URL || "http://localhost:3000/";
  const resolvedCurrentCover = currentCover 
    ? (currentCover.startsWith('http') ? currentCover : `${apiBase}${currentCover.startsWith('/') ? '' : '/'}${currentCover}`)
    : '';

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
        <ImageIcon className="w-5 h-5" />
        Обложка тайтла
      </h2>
      
      <div className="space-y-4">
        {/* Текущая обложка */}
        {(resolvedCurrentCover || previewUrl) && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-[var(--muted-foreground)]">Текущая обложка:</p>
            <div className="relative">
              <Image
                loader={() => previewUrl || resolvedCurrentCover}
                src={previewUrl || resolvedCurrentCover}
                alt="Current cover"
                className="max-w-[200px] rounded"
                width={200}
                height={300}
                unoptimized
              />
              {previewUrl && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                  <span className="text-white font-medium">Предпросмотр</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Загрузка новой обложки */}
        <div className="border border-dashed border-[var(--border)] rounded-lg p-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="cover-upload"
          />
          <label
            htmlFor="cover-upload"
            className="cursor-pointer flex flex-col items-center gap-2 p-4 hover:bg-[var(--accent)]/50 rounded transition-colors"
          >
            <Upload className="w-6 h-6 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">
              {selectedFile ? selectedFile.name : "Выберите новое изображение"}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              Нажмите для выбора файла
            </span>
          </label>
        </div>

        {/* Кнопка загрузки */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Обновить обложку
            </>
          )}
        </button>
      </div>
    </div>
  );
}