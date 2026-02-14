"use client";

import ProfileAdditionalInfo from "@/shared/profile/ProfileAdditionalInfo";
import ProfileContent from "@/shared/profile/ProfileContent";
import { useProfile } from "@/hooks/useProfile";

export default function ProfileAboutPage() {
  const { userProfile } = useProfile();

  if (!userProfile) return null;

  return (
    <div className="space-y-4 sm:space-y-6 w-full animate-fade-in-up">
      <ProfileAdditionalInfo userProfile={userProfile} />
      <ProfileContent userProfile={userProfile} />
    </div>
  );
}
