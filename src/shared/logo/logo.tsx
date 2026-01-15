import Image from "next/image";
import LOGO_IMAGE_COLOR from "../../../public/logo/tomilo_color.svg";
import SANTA_HAT_IMAGE from "../../../public/logo/snata_hat.svg";

import Link from "next/link";
export default function Logo() {
  return (
    <Link href="/" className="flex items-end  relative">
      <Image
        src={LOGO_IMAGE_COLOR}
        alt="Logo"
        width={100}
        height={50}
        priority={false}
        className="grayscale-100 hover:grayscale-0 transition-all"
      />
      {/* New Year's Santa Hat */}
      <Image
        src={SANTA_HAT_IMAGE}
        alt="Logo"
        width={30}
        height={30}
        priority={false}
        className="absolute -top-1 -right-3 z-10 rotate-30"
      />
    </Link>
  );
}
