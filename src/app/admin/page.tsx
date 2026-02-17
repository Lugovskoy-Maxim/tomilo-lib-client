import { Suspense } from "react";
import AdminPageClient from "./AdminPageClient";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <AdminPageClient />
    </Suspense>
  );
}
