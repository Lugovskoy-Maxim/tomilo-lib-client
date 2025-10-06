import Image from "next/image";
import LOGO_IMAGE_COLOR from "../../../public/logo/tomilo_color.svg";

import Link from "next/link";
export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-end grayscale-100 hover:grayscale-0 transition-all "
    >
      <Image
        src={LOGO_IMAGE_COLOR}
        alt="Logo"
        width={100}
        height={50}
        priority={false}
      />{" "}
    </Link>
  );
}
