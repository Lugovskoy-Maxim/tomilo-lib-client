import Image from "next/image";
import Avatar from '../../../public/user/avatar.gif'

export default function UserAvatar() {
  return (
    <Image src={Avatar} alt="User Avatar" width={40} height={40}  className="rounded-full " unoptimized/>
  );
}
