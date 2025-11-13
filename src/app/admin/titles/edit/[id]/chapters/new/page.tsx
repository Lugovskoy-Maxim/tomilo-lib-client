"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCreateChapterWithPagesMutation,
} from "@/store/api/chaptersApi";
import { ChapterStatus, CreateChapterDto } from "@/types/title";
import { useToast } from "@/hooks/useToast";

export default function ChapterCreatePage() {
  const params = useParams();
  const router = useRouter();
  const titleId = (params?.id as string) || "";
  const toast = useToast();

  const [createWithPages, { isLoading }] = useCreateChapterWithPagesMutation();

  const [form, setForm] = useState<Partial<CreateChapterDto>>({
    titleId,
    chapterNumber: 1,
    volumeNumber: undefined,
    title: "",
    isPublished: false,
    isFree: true,
    status: ChapterStatus.DRAFT,
    price: undefined,
    translator: "",
    proofreader: "",
    qualityCheck: "",
    releaseDate: undefined,
  });
  const [pages, setPages] = useState<File[]>([]);

  const handleChange = (name: keyof CreateChapterDto, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value as never }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setPages(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleId) {
      toast.error("Не указан ID тайтла");
      return;
    }
    if (!form.chapterNumber) {
      toast.error("Укажите номер главы");
      return;
    }
    try {
      const data: Partial<CreateChapterDto> = {
        ...form,
        titleId,
        chapterNumber: Number(form.chapterNumber),
        volumeNumber: form.volumeNumber ? Number(form.volumeNumber) : undefined,
        price: form.price ? Number(form.price) : undefined,
      };
      const created = await createWithPages({ data, pages }).unwrap();
      toast.success(`Глава #${created.chapterNumber} создана`);
      router.push(`/admin/titles/edit/${titleId}`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(`Ошибка создания: ${error?.data?.message || (error as Error)?.message || "Unknown"}`);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Добавить главу</h1>
        <button
          type="button"
          className="px-3 py-2 rounded border"
          onClick={() => router.push(`/admin/titles/edit/${titleId}`)}
        >
          Назад к тайтлу
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Номер главы</span>
            <input
              type="number"
              value={form.chapterNumber ?? ""}
              onChange={(e) => handleChange("chapterNumber", Number(e.target.value))}
              className="border rounded px-3 py-2 bg-transparent"
              required
              min={1}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Номер тома</span>
            <input
              type="number"
              value={form.volumeNumber ?? ""}
              onChange={(e) => handleChange("volumeNumber", e.target.value ? Number(e.target.value) : undefined)}
              className="border rounded px-3 py-2 bg-transparent"
              min={1}
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm">Заголовок</span>
            <input
              type="text"
              value={form.title ?? ""}
              onChange={(e) => handleChange("title", e.target.value)}
              className="border rounded px-3 py-2 bg-transparent"
              placeholder="Опционально"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Статус</span>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value as ChapterStatus)}
              className="border rounded px-3 py-2 bg-transparent"
            >
              {Object.values(ChapterStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.isPublished}
              onChange={(e) => handleChange("isPublished", e.target.checked)}
            />
            <span>Опубликована</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.isFree}
              onChange={(e) => handleChange("isFree", e.target.checked)}
            />
            <span>Бесплатная</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Цена (если платная)</span>
            <input
              type="number"
              value={form.price ?? ""}
              onChange={(e) => handleChange("price", e.target.value ? Number(e.target.value) : undefined)}
              className="border rounded px-3 py-2 bg-transparent"
              min={0}
              step={0.01}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Переводчик</span>
            <input
              type="text"
              value={form.translator ?? ""}
              onChange={(e) => handleChange("translator", e.target.value)}
              className="border rounded px-3 py-2 bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Редактор</span>
            <input
              type="text"
              value={form.proofreader ?? ""}
              onChange={(e) => handleChange("proofreader", e.target.value)}
              className="border rounded px-3 py-2 bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm">QC</span>
            <input
              type="text"
              value={form.qualityCheck ?? ""}
              onChange={(e) => handleChange("qualityCheck", e.target.value)}
              className="border rounded px-3 py-2 bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Дата релиза</span>
            <input
              type="datetime-local"
              value={form.releaseDate ? new Date(form.releaseDate).toISOString().slice(0, 16) : ""}
              onChange={(e) => handleChange("releaseDate", e.target.value ? new Date(e.target.value) : undefined)}
              className="border rounded px-3 py-2 bg-transparent"
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm">Страницы главы (изображения), можно выбрать несколько</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {!!pages.length && (
            <p className="text-xs text-muted-foreground">Выбрано файлов: {pages.length}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {isLoading ? "Сохранение..." : "Создать"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded border"
            onClick={() => router.back()}
          >
            Отмена
          </button>
        </div>
      </form>
    </main>
  );
}


