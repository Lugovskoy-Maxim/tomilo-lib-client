import { redirect } from "next/navigation";

export default function AdminWorkQueuePage() {
  redirect("/admin?tab=work-queue");
}
