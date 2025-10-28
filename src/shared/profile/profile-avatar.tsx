import Image from "next/image";
import { UserProfile } from "@/types/user";

const API_CONFIG = {
  basePublicUrl: process.env.NEXT_PUBLIC_URL || 'http://localhost:3001',
};

interface UserAvatarProps {
  userProfile: UserProfile;
}

export default function ProfileAvatar({ userProfile }: UserAvatarProps) {
  if (userProfile.avatar) {
    return (
      <Image
        loader={() => `${API_CONFIG.basePublicUrl}${userProfile.avatar}`}
        src={`${API_CONFIG.basePublicUrl}${userProfile.avatar}`}
        alt={userProfile.username}
        className="w-34 h-34 rounded-full object-cover border-4 border-[var(--background)] shadow-lg"
        height={136}
        width={136}
      />
    );
  }

  return (
    <div className="w-24 h-24 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold border-4 border-[var(--background)] shadow-lg">
      {userProfile.username[0].toUpperCase()}
    </div>
  );
}