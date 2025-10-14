"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  text?: string;
  className?: string;
  showIcon?: boolean;
}

export default function BackButton({ 
  text = "Вернуться назад", 
  className = "",
  showIcon = true 
}: BackButtonProps) {
  const router = useRouter();

  return (
    <div className="flex justify-center ">
      <button
        onClick={() => router.back()}
        className={`flex cursor-pointer items-center justify-center gap-2 px-8 py-3 bg-[var(--chart-1)] text-[var(--primary)] rounded-lg hover:bg-[var(--chart-1)]/90 transition-colors font-medium ${className}`}
      >
        {showIcon && <ArrowLeft className="w-5 h-5" />}
        {text}
      </button>
    </div>
  );
}