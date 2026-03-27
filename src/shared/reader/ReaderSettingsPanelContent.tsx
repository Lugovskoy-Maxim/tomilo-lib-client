"use client";

import { useState, type ReactNode } from "react";
import {
  List,
  Percent,
  Timer,
  Eye,
  EyeOff,
  Download,
  Smartphone,
  Wifi,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BookOpen, LayoutList } from "lucide-react";
import ThemeToggleGroup from "@/shared/theme-toggle/ThemeToggleGroup";
import { useAutoScroll, useReaderSettingsContext } from "./hooks";
import type { ImageQualityMode } from "./hooks";

interface ImageQualitySelectorProps {
  imageQuality: ImageQualityMode;
  setImageQuality: (quality: ImageQualityMode) => void;
}

function ImageQualitySelector({ imageQuality, setImageQuality }: ImageQualitySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
          Качество изображений
        </span>
        <span className="text-sm font-medium text-[var(--foreground)]">
          {imageQuality === "low"
            ? "НИЗКОЕ"
            : imageQuality === "medium"
              ? "СРЕДНЕЕ"
              : imageQuality === "high"
                ? "ВЫСОКОЕ"
                : "АВТО"}
        </span>
      </div>
      <div className="flex bg-[var(--secondary)] rounded-xl p-1">
        <button
          type="button"
          onClick={() => setImageQuality("low")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            imageQuality === "low"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          60%
        </button>
        <button
          type="button"
          onClick={() => setImageQuality("medium")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            imageQuality === "medium"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          75%
        </button>
        <button
          type="button"
          onClick={() => setImageQuality("high")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            imageQuality === "high"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          90%
        </button>
        <button
          type="button"
          onClick={() => setImageQuality("auto")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            imageQuality === "auto"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          Авто
        </button>
      </div>
      <p className="text-[10px] text-[var(--muted-foreground)]">
        Низкое качество быстрее загружается на медленном интернете
      </p>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SettingsRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)]/70 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />}
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-6 left-0.5" : "translate-x-0 left-0.5"}`}
      />
    </button>
  );
}

function SegmentOption<T extends string>({
  options,
  value,
  onChange,
}: {
  options: {
    value: T;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-[var(--secondary)] rounded-xl p-1">
      {options.map(({ value: v, label, icon: Icon, badge }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            value === v
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          {badge && (
            <span className="text-[10px] font-normal uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

const rangeInputClass =
  "w-full h-2 bg-[var(--muted)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-md";

function SliderItem({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--foreground)]">{label}</span>
        <span className="font-medium text-[var(--primary)]">{value}</span>
      </div>
      {children}
    </div>
  );
}

export interface ReaderSettingsPanelContentProps {
  imageWidth?: number;
  onImageWidthChange?: (width: number) => void;
  hideBottomMenuSetting?: boolean;
  onHideBottomMenuChange?: (value: boolean) => void;
  preloadAllImages?: boolean;
  onPreloadChange?: (value: boolean) => void;
  preloadProgress?: number;
}

export function ReaderSettingsPanelContent({
  imageWidth = 768,
  onImageWidthChange,
  hideBottomMenuSetting = false,
  onHideBottomMenuChange,
  preloadAllImages = false,
  onPreloadChange,
  preloadProgress = 0,
}: ReaderSettingsPanelContentProps) {
  const {
    showPageCounter,
    setShowPageCounter,
    readingMode,
    setReadingMode,
    fitMode,
    setFitMode,
    infiniteScroll,
    setInfiniteScroll,
    showTimer,
    setShowTimer,
    showProgress,
    setShowProgress,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    imageQuality,
    setImageQuality,
    eyeComfortMode,
    setEyeComfortMode,
    showHints,
    setShowHints,
    hapticEnabled,
    setHapticEnabled,
    dataSaver,
    setDataSaver,
    commentsSpoilerProtection,
    setCommentsSpoilerProtection,
  } = useReaderSettingsContext();
  const { autoScrollSpeed, setAutoScrollSpeed } = useAutoScroll();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 pb-10 space-y-5">
      <SettingsSection title="Основное">
        <div className="space-y-2">
          <span className="text-[11px] text-[var(--muted-foreground)]">Режим чтения</span>
          <SegmentOption
            options={[
              { value: "feed" as const, label: "Лента" },
              { value: "paged" as const, label: "По страницам" },
            ]}
            value={readingMode}
            onChange={v => {
              setReadingMode(v);
              if (v === "feed") setInfiniteScroll(true);
              if (v === "paged") setInfiniteScroll(false);
            }}
          />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] text-[var(--muted-foreground)]">Переход по главам</span>
          <SegmentOption
            options={[
              { value: "one" as const, label: "По одной", icon: BookOpen },
              { value: "feed" as const, label: "Непрерывно", icon: LayoutList, badge: "beta" },
            ]}
            value={infiniteScroll ? "feed" : "one"}
            onChange={v => setInfiniteScroll(v === "feed")}
          />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] text-[var(--muted-foreground)]">Тема</span>
          <ThemeToggleGroup />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] text-[var(--muted-foreground)]">Вмещать изображения</span>
          <SegmentOption
            options={[
              { value: "width" as const, label: "По ширине" },
              { value: "height" as const, label: "По высоте" },
            ]}
            value={fitMode}
            onChange={v => setFitMode(v)}
          />
        </div>
        {onHideBottomMenuChange && (
          <div className="space-y-2">
            <span className="text-[11px] text-[var(--muted-foreground)]">Показ нижнего меню</span>
            <SegmentOption
              options={[
                { value: "scroll" as const, label: "Скроллом" },
                { value: "click" as const, label: "Только кликом" },
              ]}
              value={hideBottomMenuSetting ? "click" : "scroll"}
              onChange={v => onHideBottomMenuChange(v === "click")}
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Слайдеры">
        <div className="space-y-3 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Изображение
          </p>
          {onImageWidthChange && (
            <SliderItem label="Ширина контейнера" value={`${imageWidth} px`}>
              <input
                type="range"
                min={320}
                max={1440}
                step={20}
                value={imageWidth}
                onChange={e => onImageWidthChange(Number(e.target.value))}
                className={rangeInputClass}
                aria-label="Ширина контейнера изображений"
              />
            </SliderItem>
          )}
          <SliderItem label="Яркость" value={`${brightness}%`}>
            <input
              type="range"
              min={50}
              max={150}
              step={5}
              value={brightness}
              onChange={e => setBrightness(Number(e.target.value))}
              className={rangeInputClass}
              aria-label="Яркость"
            />
          </SliderItem>
          <SliderItem label="Контраст" value={`${contrast}%`}>
            <input
              type="range"
              min={50}
              max={150}
              step={5}
              value={contrast}
              onChange={e => setContrast(Number(e.target.value))}
              className={rangeInputClass}
              aria-label="Контраст"
            />
          </SliderItem>
        </div>

        <div className="space-y-3 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Чтение
          </p>
          <SliderItem
            label="Скорость автопрокрутки"
            value={
              autoScrollSpeed === "slow"
                ? "Медленно"
                : autoScrollSpeed === "medium"
                  ? "Средне"
                  : "Быстро"
            }
          >
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={autoScrollSpeed === "slow" ? 0 : autoScrollSpeed === "medium" ? 1 : 2}
              onChange={e => {
                const val = Number(e.target.value);
                setAutoScrollSpeed(val === 0 ? "slow" : val === 1 ? "medium" : "fast");
              }}
              className={rangeInputClass}
              aria-label="Скорость автопрокрутки"
            />
          </SliderItem>
        </div>
      </SettingsSection>

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(v => !v)}
          className="w-full flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl bg-[var(--secondary)]/60 hover:bg-[var(--secondary)]/80 transition-colors"
          aria-expanded={isAdvancedOpen}
          aria-controls="reader-advanced-settings"
        >
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Дополнительные настройки
          </span>
          {isAdvancedOpen ? (
            <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
          )}
        </button>

        {isAdvancedOpen && (
          <div id="reader-advanced-settings" className="space-y-4">
            <SettingsSection title="Индикаторы и поведение">
              <SettingsRow label="Нумерация страниц" icon={List}>
                <ToggleSwitch
                  on={showPageCounter}
                  onClick={() => setShowPageCounter(!showPageCounter)}
                />
              </SettingsRow>
              <SettingsRow label="Прогресс главы" icon={Percent}>
                <ToggleSwitch on={showProgress} onClick={() => setShowProgress(!showProgress)} />
              </SettingsRow>
              <SettingsRow label="Время чтения" icon={Timer}>
                <ToggleSwitch on={showTimer} onClick={() => setShowTimer(!showTimer)} />
              </SettingsRow>
              <SettingsRow label="Подсказки (зум/свайп)" icon={Eye}>
                <ToggleSwitch on={showHints} onClick={() => setShowHints(!showHints)} />
              </SettingsRow>
              <SettingsRow label="Защита от спойлеров в комментариях" icon={EyeOff}>
                <ToggleSwitch
                  on={commentsSpoilerProtection}
                  onClick={() => setCommentsSpoilerProtection(!commentsSpoilerProtection)}
                />
              </SettingsRow>
              <SettingsRow label="Вибрация при перелистывании" icon={Smartphone}>
                <ToggleSwitch on={hapticEnabled} onClick={() => setHapticEnabled(!hapticEnabled)} />
              </SettingsRow>
              <SettingsRow label="Экономия трафика" icon={Wifi}>
                <ToggleSwitch on={dataSaver} onClick={() => setDataSaver(!dataSaver)} />
              </SettingsRow>
              {onHideBottomMenuChange && (
                <SettingsRow label="Скрывать нижнее меню" icon={Eye}>
                  <ToggleSwitch
                    on={hideBottomMenuSetting}
                    onClick={() => onHideBottomMenuChange(!hideBottomMenuSetting)}
                  />
                </SettingsRow>
              )}
            </SettingsSection>

            <SettingsSection title="Качество и комфорт">
              <div className="space-y-2 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
                <span className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider">
                  Режим защиты глаз
                </span>
                <SegmentOption
                  options={[
                    { value: "off" as const, label: "Откл.", icon: Eye },
                    { value: "warm" as const, label: "Тёплая", icon: Eye },
                    { value: "sepia" as const, label: "Сепия", icon: Eye },
                    { value: "dark" as const, label: "Тёмный", icon: Eye },
                  ]}
                  value={eyeComfortMode}
                  onChange={v => setEyeComfortMode(v)}
                />
              </div>
              <ImageQualitySelector imageQuality={imageQuality} setImageQuality={setImageQuality} />
            </SettingsSection>

            {onPreloadChange && (
              <SettingsSection title="Загрузка">
                <SettingsRow
                  label={
                    preloadAllImages && preloadProgress > 0 && preloadProgress < 100
                      ? `Предзагрузка главы (${preloadProgress}%)`
                      : "Предзагрузка главы"
                  }
                  icon={Download}
                >
                  <ToggleSwitch
                    on={preloadAllImages}
                    onClick={() => onPreloadChange(!preloadAllImages)}
                  />
                </SettingsRow>
              </SettingsSection>
            )}
          </div>
        )}
      </section>

      {!isAdvancedOpen && (
        <p className="text-[10px] text-[var(--muted-foreground)] px-1">
          Открывай «Дополнительные настройки» для индикаторов, качества и предзагрузки.
        </p>
      )}
    </div>
  );
}
