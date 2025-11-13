"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetChapterByIdQuery,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useAddPagesToChapterMutation,
} from "@/store/api/chaptersApi";
import { Chapter, ChapterStatus, UpdateChapterDto } from "@/types/title";
import { Footer, Header } from "@/widgets";
import { useToast } from "@/hooks/useToast";

export default function ChapterEditPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = (params?.chatperId as string) || ""; // маршрут содержит chapterId
  const titleId = (params?.id as string) || ""; // маршрут содержит id
  const toast = useToast();

  const { data, isLoading, isError } = useGetChapterByIdQuery(chapterId, {
    skip: !chapterId,
  });
  const [updateChapter, { isLoading: isSaving }] = useUpdateChapterMutation();
  const [deleteChapter, { isLoading: isDeleting }] = useDeleteChapterMutation();
  const [addPagesToChapter, { isLoading: isUploading }] =
    useAddPagesToChapterMutation();

  const [form, setForm] = useState<Partial<Chapter>>({});
  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_UPLOADS_URL || "http://localhost:3001/uploads",
    []
  );

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title,
        chapterNumber: data.chapterNumber,
        volumeNumber: data.volumeNumber,
        isPublished: data.isPublished,
        isFree: data.isFree,
        status: data.status,
        price: data.price,
        translator: data.translator,
        proofreader: data.proofreader,
        qualityCheck: data.qualityCheck,
      });
    }
  }, [data]);

  const handleChange = (name: keyof UpdateChapterDto, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value as never }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterId) return;
    try {
      const dto: Partial<UpdateChapterDto> = {
        title: form.title,
        chapterNumber: form.chapterNumber
          ? Number(form.chapterNumber)
          : undefined,
        volumeNumber: form.volumeNumber ? Number(form.volumeNumber) : undefined,
        isPublished: form.isPublished,
        isFree: form.isFree,
        status: form.status,
        price: form.price ? Number(form.price) : undefined,
        translator: form.translator,
        proofreader: form.proofreader,
        qualityCheck: form.qualityCheck,
      };
      const updated = await updateChapter({
        id: chapterId,
        data: dto,
      }).unwrap();
      toast.success(`Глава #${updated.chapterNumber} обновлена`);
      router.back();
    } catch (err) {
      toast.error(
        `Ошибка: ${
          (err as { data?: { message?: string } })?.data?.message ||
          (err as Error).message ||
          "Unknown"
        }`
      );
    }
  };

  const handleDelete = async () => {
    if (!chapterId) return;
    if (!confirm("Удалить главу?")) return;
    try {
      await deleteChapter(chapterId).unwrap();
      toast.success("Глава удалена");
      router.back();
    } catch (err) {
      toast.error(
        `Ошибка удаления: ${
          (err as { data?: { message?: string } })?.data?.message ||
          (err as Error).message ||
          "Unknown"
        }`
      );
    }
  };

  const handleUploadPages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!chapterId) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      await addPagesToChapter({ id: chapterId, pages: files }).unwrap();
      toast.success("Страницы добавлены");
    } catch (err) {
      toast.error(
        `Ошибка загрузки страниц: ${
          (err as { data?: { message?: string } })?.data?.message ||
          (err as Error).message ||
          "Unknown"
        }`
      );
    } finally {
      e.currentTarget.value = "";
    }
  };

  if (isLoading) return <main className="p-8">Загрузка...</main>;
  if (isError || !data) return <main className="p-8">Глава не найдена</main>;

  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">
            Редактирование главы #{data.chapterNumber}
          </h1>
          <button
            type="button"
            className="px-3 py-2 rounded border"
            onClick={() => router.push(`/admin/titles/edit/${titleId}`)}
          >
            Назад к тайтлу
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Номер главы</span>
              <input
                type="number"
                value={form.chapterNumber ?? ""}
                onChange={(e) =>
                  handleChange(
                    "chapterNumber",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="border rounded px-3 py-2 bg-transparent"
                min={1}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Номер тома</span>
              <input
                type="number"
                value={form.volumeNumber ?? ""}
                onChange={(e) =>
                  handleChange(
                    "volumeNumber",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
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
                onChange={(e) =>
                  handleChange("status", e.target.value as ChapterStatus)
                }
                className="border rounded px-3 py-2 bg-transparent"
              >
                {Object.values(ChapterStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
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
                onChange={(e) =>
                  handleChange(
                    "price",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
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
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
            >
              {isSaving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded border"
              onClick={() => router.back()}
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isDeleting}
              className="px-4 py-2 rounded bg-[var(--destructive)] text-[var(--destructive-foreground)] disabled:opacity-50 ml-auto"
              onClick={handleDelete}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </button>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Страницы главы</h2>
              <label className="px-3 py-2 border rounded cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadPages}
                  className="hidden"
                />
                {isUploading ? "Загрузка..." : "Добавить страницы"}
              </label>
            </div>
            {Array.isArray(data.pages) && data.pages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.pages.map((p: string, idx: number) => {
                  const isAbsolute =
                    p.startsWith("http://") ||
                    p.startsWith("https://") ||
                    p.startsWith("data:");
                  let path = p;
                  // normalize wrong api prefix to uploads
                  if (path.startsWith("/api/"))
                    path = path.replace(/^\/api\//, "/uploads/");
                  if (path.startsWith("api/"))
                    path = path.replace(/^api\//, "uploads/");
                  const src = isAbsolute
                    ? path
                    : `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
                  return (
                    <div
                      key={`${p}-${idx}`}
                      className="border rounded overflow-hidden bg-black/5"
                    >
                      <img
                        src={src}
                        alt={`p-${idx + 1}`}
                        className="w-full h-auto block"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-[var(--muted-foreground)]">
                Пока нет страниц. Добавьте изображения выше.
              </div>
            )}
            <p className="text-xs text-[var(--muted-foreground)]">
              Удаление/перестановка страниц пока не поддерживается на сервере.
            </p>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
