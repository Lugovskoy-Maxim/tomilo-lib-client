"use client";

interface Collection {
  name: string;
  image: string;
  link: string;
}

interface CollectionCardProps {
  data: Collection;
}

export default function CollectionCard({ data }: CollectionCardProps) {
  // Защита от undefined
  if (!data) {
    return (
      <div className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 group relative select-none bg-[var(--card)] rounded-lg border border-[var(--border)] animate-pulse">
        <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-gray-300" />
      </div>
    );
  }

  const { image, name } = data;

  return (
    <div
      draggable="false"
      className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 group relative select-none bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-all duration-300 overflow-hidden cursor-pointer active:cursor-grabbing"
    >
      <div className="aspect-[3/4] relative rounded-lg overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ 
            backgroundImage: image ? `url(${image})` : 'none',
            backgroundColor: !image ? '#f3f4f6' : 'transparent'
          }}
          draggable="false"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          <h3 className="text-xs sm:text-sm font-bold drop-shadow-lg text-center leading-tight">
            {name || 'Без названия'}
          </h3>
        </div>
      </div>
    </div>
  );
}