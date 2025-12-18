import React from "react";
import Modal from "@/shared/modal/modal";
import Image from "next/image";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, altText = "Предпросмотр изображения" }: ImagePreviewModalProps) {

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Предпросмотр изображения">
      <div className="flex justify-center">
        {imageUrl ? (
          <Image
                loader={({ src, width }) => `${src}?w=${width}`}
            src={process.env.NEXT_PUBLIC_UPLOADS_URL + imageUrl}
            alt={altText}
            width={400}
            height={600}
            className="max-w-full h-auto rounded-lg"
            unoptimized
          />
        ) : (
          <div className="text-center py-10 text-gray-500">
            Изображение не найдено
          </div>
        )}
      </div>
    </Modal>
  );
}