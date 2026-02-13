import { useState, useEffect } from "react";
import { UserProfile } from "@/types/user";
import { Eye } from "lucide-react";
import { READ_CHAPTERS_IN_ROW_ENABLED } from "@/shared/reader/hooks";

interface ProfileReadingSettingsProps {
  userProfile: UserProfile;
}

const CHAPTERS_IN_ROW_KEY = "reader-chapters-in-row";

export default function ProfileReadingSettings({}: ProfileReadingSettingsProps) {
  const [imageWidth, setImageWidth] = useState(768);
  const [readChaptersInRow, setReadChaptersInRow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedWidth = localStorage.getItem("reader-image-width");
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= 768 && width <= 1440) {
        setImageWidth(width);
      }
    }
    const savedChaptersInRow = localStorage.getItem(CHAPTERS_IN_ROW_KEY);
    if (savedChaptersInRow !== null) {
      setReadChaptersInRow(savedChaptersInRow === "true");
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("reader-image-width", imageWidth.toString());
      localStorage.setItem(CHAPTERS_IN_ROW_KEY, readChaptersInRow.toString());
    } catch (error) {
      console.error("Ошибка при сохранении настроек:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--chart-2)] to-[var(--chart-3)] shadow-lg">
          <Eye className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
            Чтение
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm">
            Режим отображения и ширина страниц
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="py-3 px-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]/50">
          <span className="text-sm font-semibold text-[var(--foreground)] block mb-2">
            Тип отображения
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Как отображать страницы при чтении
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-2.5 px-3 text-sm font-medium rounded-xl border border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors"
              onClick={() => console.log("single")}
            >
              По одной
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 px-3 text-sm font-medium rounded-xl border border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors"
              onClick={() => console.log("continuous")}
            >
              Прокрутка
            </button>
          </div>
        </div>

        {READ_CHAPTERS_IN_ROW_ENABLED && (
          <div className="py-3 px-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]/50">
            <span className="text-sm font-semibold text-[var(--foreground)] block mb-2">
              Чтение глав подряд
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              При прокрутке до конца или начала главы подгружается следующая или предыдущая глава; адрес в строке обновляется на ту, что вы читаете.
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={readChaptersInRow}
                onChange={e => setReadChaptersInRow(e.target.checked)}
                className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">Включить чтение глав подряд</span>
            </label>
          </div>
        )}

        <div className="py-3 px-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]/50">
          <span className="text-sm font-semibold text-[var(--foreground)] block mb-2">
            Ориентация экрана
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Предпочтительная ориентация при чтении
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="py-2.5 px-3 text-sm font-medium rounded-xl border border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors"
              onClick={() => console.log("auto")}
            >
              Авто
            </button>
            <button
              type="button"
              className="py-2.5 px-3 text-sm font-medium rounded-xl border border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors"
              onClick={() => console.log("portrait")}
            >
              Портрет
            </button>
            <button
              type="button"
              className="py-2.5 px-3 text-sm font-medium rounded-xl border border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors"
              onClick={() => console.log("landscape")}
            >
              Альбом
            </button>
          </div>
        </div>

        <div className="py-3 px-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-[var(--foreground)] block">
                Ширина изображений
              </span>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Ширина страниц в читалке (768–1440 px)
              </p>
            </div>
            <span className="text-sm font-bold text-[var(--primary)] tabular-nums">
              {imageWidth} px
            </span>
          </div>
          <input
            type="range"
            min={768}
            max={1440}
            step={64}
            value={imageWidth}
            onChange={e => setImageWidth(Number(e.target.value))}
            className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-[var(--muted)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
          />
          <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
            <span>768</span>
            <span>1440</span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--border)]/50">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSaving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
