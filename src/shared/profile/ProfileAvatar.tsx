import { UserProfile } from "@/types/user";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

const API_CONFIG = {
  basePublicUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:3001",
};

interface UserAvatarProps {
  userProfile: UserProfile;
}

export default function ProfileAvatar({ userProfile }: UserAvatarProps) {
  // Проверяем, что username существует и не пустой
  const displayName =
    userProfile.username && userProfile.username.length > 0
      ? userProfile.username.charAt(0).toUpperCase()
      : "?";

  if (userProfile.avatar) {
    // Проверяем, является ли avatar полным URL
    const avatarUrl = userProfile.avatar.startsWith("http")
      ? userProfile.avatar
      : `${API_CONFIG.basePublicUrl}${userProfile.avatar}`;

    return (
      <div className="relative group">
        {/* Animated ring effect */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 group-hover:opacity-100 blur-sm group-hover:blur-md transition-all duration-500 animate-pulse" />
        
        {/* Glow effect layer */}
        <div className="absolute -inset-2 rounded-full bg-[var(--primary)]/20 blur-xl group-hover:bg-[var(--primary)]/30 transition-all duration-500" />
        
        {/* Main avatar container */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[var(--background)] shadow-2xl glow-avatar transition-transform duration-300 group-hover:scale-105">
          <OptimizedImage
            src={avatarUrl}
            alt={userProfile.username || "User avatar"}
            className="w-full h-full object-cover"
            height={144}
            width={144}
            priority={true}
          />
        </div>
      </div>
    );
  }

  // Fallback avatar with initials
  return (
    <div className="relative group">
      {/* Animated ring effect */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 group-hover:opacity-100 blur-sm group-hover:blur-md transition-all duration-500 animate-pulse" />
      
      {/* Glow effect layer */}
      <div className="absolute -inset-2 rounded-full bg-[var(--primary)]/20 blur-xl group-hover:bg-[var(--primary)]/30 transition-all duration-500" />
      
      {/* Main avatar container */}
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-4 border-[var(--background)] shadow-2xl glow-avatar transition-transform duration-300 group-hover:scale-105">
        <span className="drop-shadow-lg">{displayName}</span>
      </div>
    </div>
  );
}
