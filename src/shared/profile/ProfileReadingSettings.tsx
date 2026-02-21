import { useState, useEffect } from "react";
import { UserProfile, ReadingSettings } from "@/types/user";
import { Eye } from "lucide-react";
import { READ_CHAPTERS_IN_ROW_ENABLED } from "@/shared/reader/hooks";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

interface ProfileReadingSettingsProps {
  userProfile: UserProfile;
}

const CHAPTERS_IN_ROW_KEY = "reader-chapters-in-row";
const IMAGE_WIDTH_KEY = "reader-image-width";

function getInitialFromProfileOrStorage(
  profile: UserProfile | undefined,
): Partial<ReadingSettings> & { imageWidth: number; readChaptersInRow: boolean } {
  const fromProfile = profile?.readingSettings;
  if (typeof window === "undefined") {
    return {
      readingMode: fromProfile?.readingMode ?? "single",
      orientation: fromProfile?.orientation ?? "auto",
      imageWidth: fromProfile?.imageWidth ?? 768,
      readChaptersInRow: fromProfile?.readChaptersInRow ?? false,
    };
  }
  const storedWidth = localStorage.getItem(IMAGE_WIDTH_KEY);
  const width =
    fromProfile?.imageWidth ??
    (storedWidth ? Math.min(1440, Math.max(768, parseInt(storedWidth, 10))) : 768);
  const storedChaptersInRow = localStorage.getItem(CHAPTERS_IN_ROW_KEY);
  const readChaptersInRow =
    fromProfile?.readChaptersInRow ?? storedChaptersInRow === "true";
  return {
    readingMode: fromProfile?.readingMode ?? "single",
    orientation: fromProfile?.orientation ?? "auto",
    imageWidth: Number.isNaN(width) ? 768 : width,
    readChaptersInRow,
  };
}

export default function ProfileReadingSettings({
  userProfile,
}: ProfileReadingSettingsProps) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  const initial = getInitialFromProfileOrStorage(userProfile);
  const [readingMode, setReadingMode] = useState<
    "single" | "continuous"
  >(initial.readingMode ?? "single");
  const [orientation, setOrientation] = useState<
    "auto" | "portrait" | "landscape"
  >(initial.orientation ?? "auto");
  const [imageWidth, setImageWidth] = useState(initial.imageWidth);
  const [readChaptersInRow, setReadChaptersInRow] = useState(
    initial.readChaptersInRow,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const next = getInitialFromProfileOrStorage(userProfile);
    setReadingMode((next.readingMode as "single" | "continuous") ?? "single");
    setOrientation((next.orientation as "auto" | "portrait" | "landscape") ?? "auto");
    setImageWidth(next.imageWidth);
    setReadChaptersInRow(next.readChaptersInRow);
  }, [userProfile._id, userProfile.readingSettings]);

  const readingSettings: ReadingSettings = {
    readingMode,
    orientation,
    imageWidth,
    readChaptersInRow,
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(IMAGE_WIDTH_KEY, imageWidth.toString());
        localStorage.setItem(CHAPTERS_IN_ROW_KEY, readChaptersInRow.toString());
      }
      await updateProfile({ readingSettings }).unwrap();
      toast.success("Настройки чтения сохранены");
    } catch (error) {
      console.error("Ошибка при сохранении настроек чтения:", error);
      toast.error("Не удалось сохранить настройки");
    } finally {
      setIsSaving(false);
    }
  };

  const setMode = (mode: "single" | "continuous") => {
    setReadingMode(mode);
  };

  const setOri = (ori: "auto" | "portrait" | "landscape") => {
    setOrientation(ori);
  };

  const saving = isSaving || isLoading;

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <Eye className="w-5 h-5 text-[var(--chart-1)]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            Чтение
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm">
            Режим отображения и ширина страниц
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <span className="text-sm font-semibold text-[var(--foreground)] block mb-2">
            Тип отображения
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Как отображать страницы при чтении
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-xl border transition-colors ${
                readingMode === "single"
                  ? "border-[var(--chart-1)] bg-[var(--chart-1)]/15 text-[var(--chart-1)]"
                  : "border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--accent)] text-[var(--foreground)]"
              }`}
            >
              По одной
            </button>
            <button
              type="button"
              onClick={() => setMode("continuous")}
              className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-xl border transition-colors ${
                readingMode === "continuous"
                  ? "border-[var(--chart-1)] bg-[var(--chart-1)]/15 text-[var(--chart-1)]"
                  : "border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--accent)] text-[var(--foreground)]"
              }`}
            >
              Прокрутка
            </button>
          </div>
        </div>

        {READ_CHAPTERS_IN_ROW_ENABLED && (
          <div className="py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
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
                className="w-5 h-5 rounded border-[var(--border)] text-[var(--chart-1)] focus:ring-[var(--chart-1)]"
              />
              <span className="text-sm text-[var(--foreground)]">Включить чтение глав подряд</span>
            </label>
          </div>
        )}

        <div className="py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <span className="text-sm font-semibold text-[var(--foreground)] block mb-2">
            Ориентация экрана
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Предпочтительная ориентация при чтении
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "auto" as const, label: "Авто" },
                { value: "portrait" as const, label: "Портрет" },
                { value: "landscape" as const, label: "Альбом" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setOri(value)}
                className={`py-2.5 px-3 text-sm font-medium rounded-xl border transition-colors ${
                  orientation === value
                    ? "border-[var(--chart-1)] bg-[var(--chart-1)]/15 text-[var(--chart-1)]"
                    : "border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--accent)] text-[var(--foreground)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-[var(--foreground)] block">
                Ширина изображений
              </span>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Ширина страниц в читалке (768–1440 px)
              </p>
            </div>
            <span className="text-sm font-bold text-[var(--chart-1)] tabular-nums">
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
            className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-[var(--muted)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--chart-1)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
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
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--chart-1)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
