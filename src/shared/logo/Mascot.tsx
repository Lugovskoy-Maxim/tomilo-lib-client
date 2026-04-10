"use client";

import Image from "next/image";

export default function Mascot() {
  return (
    <div className="pointer-events-none select-none">
      <Image
        src="/logo/mascot.png"
        alt=""
        width={80}
        height={80}
        className="animate-bounce [animation-duration:4s] drop-shadow-lg"
        priority
        unoptimized
      />
    </div>
  );
}
