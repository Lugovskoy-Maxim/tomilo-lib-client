import React from "react";
import Modal from "@/shared/modal/modal";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { getImageUrls } from "@/lib/asset-url";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  altText = "Предпросмотр изображения",
}: ImagePreviewModalProps) {
  const { primary, fallback } = getImageUrls(imageUrl);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Предпросмотр изображения">
      <div className="flex justify-center">
        {imageUrl ? (
          <OptimizedImage
            src={primary}
            fallbackSrc={fallback}
            alt={altText}
            width={400}
            height={600}
            className="max-w-full h-auto rounded-[var(--admin-radius)]"
          />
        ) : (
          <div className="text-center py-10 text-gray-500">Изображение не найдено</div>
        )}
      </div>
    </Modal>
  );
}
