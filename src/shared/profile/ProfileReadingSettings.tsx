import { useState, useEffect } from "react";
import { UserProfile } from "@/types/user";
import { Eye, Settings } from "lucide-react";

interface ProfileReadingSettingsProps {
  userProfile: UserProfile;
}

export default function ProfileReadingSettings({ userProfile }: ProfileReadingSettingsProps) {
  const [imageWidth, setImageWidth] = useState(768);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Загружаем сохраненную ширину изображений из localStorage
    const savedWidth = localStorage.getItem("reader-image-width");
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= 768 && width <= 1440) {
        setImageWidth(width);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Сохраняем настройки локально
      localStorage.setItem("reader-image-width", imageWidth.toString());
      console.log("Сохранена ширина изображений:", imageWidth);
    } catch (error) {
      console.error("Ошибка при сохранении настроек:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-3 mb-4">
        <Eye className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Чтение</h2>
      </div>

      <div className="space-y-6">
        {/* Настройки типа отображения */}
        <div>
          <span className="text-sm font-medium text-[var(--foreground)] block mb-2">
            Тип отображения
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-2">
            Как отображать страницы при чтении
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => console.log("single")}
            >
              По одной странице
            </button>
            <button
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => console.log("continuous")}
            >
              Непрерывная прокрутка
            </button>
          </div>
        </div>

        {/* Настройки ориентации экрана */}
        <div>
          <span className="text-sm font-medium text-[var(--foreground)] block mb-2">
            Ориентация экрана
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-2">
            Предпочтительная ориентация при чтении
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => console.log("auto")}
            >
              Автоматически
            </button>
            <button
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => console.log("portrait")}
            >
              Портретная
            </button>
            <button
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => console.log("landscape")}
            >
              Альбомная
            </button>
          </div>
        </div>

        {/* Настройка ширины изображений */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-[var(--foreground)] block">
                Ширина изображений
              </span>
              <p className="text-xs text-[var(--muted-foreground)]">
                Настройте ширину изображений в читалке
              </p>
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">{imageWidth}px</span>
          </div>

          <div className="pl-0">
            <input
              type="range"
              min="768"
              max="1440"
              step="64"
              value={imageWidth}
              onChange={e => setImageWidth(Number(e.target.value))}
              className="w-full h-2 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer"
              style={{
                background: "var(--muted)",
                outline: "none",
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-[var(--muted-foreground)]">
              <span>768px</span>
              <span>1440px</span>
            </div>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-end pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
