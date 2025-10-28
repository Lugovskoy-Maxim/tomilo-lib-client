import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function ProfileHeader() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--muted-foreground)] mb-2">
            Профиль пользователя
          </h1>
          <p className="text-[var(--muted-foreground)] text-sm">
            Управление вашим аккаунтом и отслеживание прогресса чтения
          </p>
        </div>
        
        {isAdmin && (
          <Link 
            href="/titles/new"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить тайтл
          </Link>
        )}
      </div>
    </div>
  );
}

export default ProfileHeader;