import Image from "next/image";
import LOGO_IMAGE_COLOR from "../../../public/logo/tomilo_color.svg";
// import SANTA_HAT_IMAGE from "../../../public/logo/snata_hat.svg";

import Link from "next/link";

type LogoVariant = "header" | "footer" | "default";

const variantSizes = {
  header: {
    width: 100,
    height: 50,
    className:
      "w-16 h-8 sm:w-20 sm:h-10 md:w-[100px] md:h-[50px] object-contain object-left",
  },
  footer: {
    width: 120,
    height: 60,
    className:
      "w-20 h-10 sm:w-24 sm:h-12 md:w-[120px] md:h-[60px] object-contain object-left",
  },
  default: {
    width: 100,
    height: 50,
    className:
      "w-20 h-10 sm:w-[100px] sm:h-[50px] object-contain object-left",
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
        transition-transform duration-200 active:scale-[0.98]
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
        className={`${sizeClass} grayscale-[80%] group-hover:grayscale-0 transition-[filter] duration-300 ease-out`}
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
