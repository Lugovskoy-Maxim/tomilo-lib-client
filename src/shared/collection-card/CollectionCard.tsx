"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Library } from "lucide-react";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { Collection } from "@/types/collection";

interface CollectionCardProps {
  data: Collection;
}

export default function CollectionCard({ data }: CollectionCardProps) {
  const router = useRouter();

  // Защита от undefined
  if (!data) {
    return (
      <div className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 group relative select-none rounded-xl animate-pulse">
        <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-[var(--muted)] shadow-lg" />
      </div>
    );
  }

  const collectionId = data.id;
  const collectionLink = `/collections/${collectionId}`;
  const collectionImage = data.cover;
  const collectionName = data.name;
  const titlesCount = data.titles?.length || data.titlesCount || 0;

  const handleClick = () => {
    if (collectionLink) {
      router.push(collectionLink);
    }
  };

  const getImageUrl = () => {
    if (!collectionImage) return IMAGE_HOLDER;
    return `${process.env.NEXT_PUBLIC_URL}${collectionImage}`;
  };

  const imageUrl = getImageUrl();
  const imageUrlString = typeof imageUrl === "string" ? imageUrl : imageUrl.src;

  return (
    <div
      draggable="false"
      className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 group relative select-none rounded-xl overflow-hidden cursor-pointer transform transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-1 hover:shadow-2xl"
      onClick={handleClick}
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/30 group-hover:via-chart-1/30 group-hover:to-primary/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500 ease-out -z-10" />
      
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--card)] shadow-lg ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-500">
        {/* Image container with zoom effect */}
        <div className="relative w-full h-full overflow-hidden">
          <OptimizedImage
            src={imageUrlString}
            alt={collectionName || "Коллекция"}
            width={144}
            height={192}
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-110"
            quality={85}
            priority={false}
            onError={() => {
              console.warn(`Failed to load image for collection ${collectionName}`);
            }}
          />
        </div>
        
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        
        {/* Top badge with count */}
        <div className="absolute top-2 right-2 transform translate-y-[-2px] group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full border border-white/20 shadow-lg">
            <Library className="w-3 h-3" />
            <span>{titlesCount}</span>
          </div>
        </div>
        
        {/* Bottom content with enhanced typography */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-xs sm:text-sm font-bold drop-shadow-lg text-center leading-tight line-clamp-2 group-hover:text-primary-foreground transition-colors duration-300">
            {collectionName || "Без названия"}
          </h3>
          <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-primary to-transparent mt-2 transition-all duration-500 ease-out" />
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
        </div>
      </div>
    </div>
  );
}
