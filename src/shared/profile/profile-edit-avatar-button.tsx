"use client";
import { useState } from "react";

function EditAvatarButton() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <button
      onClick={() => setIsEditing(!isEditing)}
      className="absolute -bottom-1 -right-1 p-1.5 bg-[var(--primary)] text-white rounded-full hover:bg-[var(--primary)]/90 transition-colors border-2 border-[var(--background)]"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </button>
  );
}

export default EditAvatarButton;