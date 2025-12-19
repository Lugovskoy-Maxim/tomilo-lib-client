

import React, { useState, ChangeEvent } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface CoverUploadSectionProps {
  titleId: string;
  currentCover?: string;
  onCoverUpdate: (newCoverUrl: string) => void;
  selectedFile: File | null;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function CoverUploadSection({ 
  titleId, 
  currentCover, 
  onCoverUpdate, 
  selectedFile, 
  onImageChange 
}: CoverUploadSectionProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Создаем превью для выбранного файла
  React.useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

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
            <p className="text-sm text-[var(--muted-foreground)]">
              {previewUrl ? "Предпросмотр новой обложки:" : "Текущая обложка:"}
            </p>
            <div className="relative">
              <Image
                loader={() => previewUrl || resolvedCurrentCover}
                src={previewUrl || resolvedCurrentCover}
                alt="Cover"
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
            onChange={onImageChange}
            className="hidden"
            id="cover-upload"
          />
          <label
            htmlFor="cover-upload"
            className="cursor-pointer flex flex-col items-center gap-2 p-4 hover:bg-[var(--accent)]/50 rounded transition-colors"
          >
            <Upload className="w-6 h-6 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">
              {selectedFile ? selectedFile.name : "Выберите изображение для обложки"}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              Поддерживаемые форматы: JPG, PNG, WebP
            </span>
          </label>
        </div>


        {selectedFile && (
          <div className="text-sm text-[var(--muted-foreground)] bg-[var(--accent)]/20 p-3 rounded">
            Выбрано изображение: <span className="font-medium">{selectedFile.name}</span>
            <br />
            Размер: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </div>
        )}
      </div>
    </div>
  );
}
