import { UserProfile } from "@/types/user";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

const API_CONFIG = {
  basePublicUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:3001",
};

interface UserAvatarProps {
  userProfile: UserProfile;
}

export default function ProfileAvatar({ userProfile }: UserAvatarProps) {
  if (userProfile.avatar) {
    // Проверяем, является ли avatar полным URL
    const avatarUrl = userProfile.avatar.startsWith("http")
      ? userProfile.avatar
      : `${API_CONFIG.basePublicUrl}${userProfile.avatar}`;

    return (
      <OptimizedImage
        src={avatarUrl}
        alt={userProfile.username || "User avatar"}
        className="w-34 h-34 rounded-full object-cover border-4 border-[var(--background)] shadow-lg"
        height={136}
        width={136}
        priority={true}
      />
    );
  }

  // Проверяем, что username существует и не пустой
  const displayName =
    userProfile.username && userProfile.username.length > 0
      ? userProfile.username.charAt(0).toUpperCase()
      : "?";

  return (
    <div className="w-34 h-34 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold border-4 border-[var(--background)] shadow-lg">
      <span className="text-2xl">{displayName}</span>
    </div>
  );
}
