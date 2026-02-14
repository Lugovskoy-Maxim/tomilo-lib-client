"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserProfileIndexPage() {
  const params = useParams();
  const router = useRouter();
  const username = typeof params.username === "string" ? params.username : "";

  useEffect(() => {
    if (username) {
      router.replace(`/user/${username}/about`);
    }
  }, [username, router]);

  return null;
}
