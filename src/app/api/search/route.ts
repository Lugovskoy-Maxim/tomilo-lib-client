import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const url = new URL("/titles", API_BASE);
    url.searchParams.set("search", q);
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) {
      // Возвращаем пустой результат вместо проброса 4xx/5xx, чтобы не ломать UI
      return NextResponse.json([], { status: 200 });
    }

    const data = await res.json();
    const titles = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.titles)
        ? data.titles
        : Array.isArray(data)
          ? data
          : [];

    const results = titles
      .map(
        (t: {
          _id?: string;
          id?: string;
          name?: string;
          title?: string;
          coverImage?: string;
          image?: string;
          description?: string;
          type?: string;
          releaseYear?: number;
          year?: number;
          rating?: number;
        }) => ({
          id: String(t._id ?? t.id ?? ""),
          title: String(t.name ?? t.title ?? ""),
          cover: t.coverImage ?? t.image ?? undefined,
          description: t.description ?? undefined,
          type: t.type ?? undefined,
          releaseYear: t.releaseYear ?? t.year ?? undefined,
          rating: t.rating ?? undefined,
        }),
      )
      .filter((r: { id: string; title: string }) => r.id && r.title);

    return NextResponse.json(results, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Search proxy error" }, { status: 500 });
  }
}
