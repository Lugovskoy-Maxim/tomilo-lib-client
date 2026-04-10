"use client";

import Image from "next/image";
// import LOGO_IMAGE_COLOR from "../../../public/logo/tomilo_color.png";
import LOGO_IMAGE_COLOR from "../../../public/logo/tomilo_color.svg";
// import LOGO_IMAGE_DECOR from "../../../public/logo/tomilo_decor.png";

import Link from "next/link";

type LogoVariant = "header" | "footer" | "default";

const variantSizes = {
  header: {
    width: 100,
    height: 50,
    className: "w-28 h-16 sm:w-20 sm:h-12 md:w-[120px] md:h-[70px] object-contain object-left",
  },
  footer: {
    width: 120,
    height: 60,
    className: "w-20 h-10 sm:w-24 sm:h-12 md:w-[120px] md:h-[60px] object-contain object-left",
  },
  default: {
    width: 100,
    height: 50,
    className: "w-20 h-10 sm:w-[100px] sm:h-[50px] object-contain object-left",
  },
} satisfies Record<LogoVariant, { width: number; height: number; className: string }>;

export default function Logo({
  variant = "default",
  className,
}: {
  variant?: LogoVariant;
  className?: string;
}) {
  const { width, height, className: sizeClass } = variantSizes[variant];

  return (
    <Link
      href="/"
      className={`
        group flex items-center relative rounded-lg
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]
        ${className ?? ""}
      `}
      aria-label="Tomilo-lib — перейти на главную"
    >
      <div className="relative">
        <Image
          src={LOGO_IMAGE_COLOR}
          alt="Tomilo-lib"
          width={width}
          height={height}
          priority={variant === "header"}
          sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, 120px"
          className={sizeClass}
        />
        {/* <Image
          src={LOGO_IMAGE_DECOR}
          alt="Tomilo-lib"
          width={width}
          height={height}
          priority={variant === "header"}
          sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, 140px"
          className={`${sizeClass} absolute top-0 left-0 z-10 transform scale-x-110 scale-y-110 origin-center opacity-80`}
        /> */}
      </div>
    </Link>
  );
}
