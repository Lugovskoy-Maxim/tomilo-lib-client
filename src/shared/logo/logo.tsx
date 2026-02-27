import Image from "next/image";
import LOGO_IMAGE_COLOR from "../../../public/logo/logo_dragon.png.png";
// import SANTA_HAT_IMAGE from "../../../public/logo/snata_hat.svg";

import Link from "next/link";

type LogoVariant = "header" | "footer" | "default";

const variantSizes = {
  header: {
    width: 140,
    height: 70,
    className:
      "w-24 h-12 sm:w-28 sm:h-14 md:w-[140px] md:h-[70px] object-contain object-left",
  },
  footer: {
    width: 160,
    height: 80,
    className:
      "w-28 h-14 sm:w-32 sm:h-16 md:w-[160px] md:h-[80px] object-contain object-left",
  },
  default: {
    width: 140,
    height: 70,
    className:
      "w-28 h-14 sm:w-[140px] sm:h-[70px] object-contain object-left",
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
      <Image
        src={LOGO_IMAGE_COLOR}
        alt="Tomilo-lib"
        width={width}
        height={height}
        priority={variant === "header"}
        sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, 120px"
        className={sizeClass}
      />
      {/* New Year's Santa Hat
      <Image
        src={SANTA_HAT_IMAGE}
        alt=""
        width={30}
        height={30}
        priority={false}
        className="absolute -top-1 -right-3 z-10 rotate-30"
      /> */}
    </Link>
  );
}
