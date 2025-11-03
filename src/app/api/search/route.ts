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

    const res = await fetch(url.toString(), { cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) {
      // Возвращаем пустой результат вместо проброса 4xx/5xx, чтобы не ломать UI
      return NextResponse.json([], { status: 200 });
    }

    const data = await res.json();
    const titles = Array.isArray(data?.titles) ? data.titles : (data?.data || []);

    const results = titles.map((t: any) => ({
      id: String(t._id ?? t.id ?? ""),
      title: String(t.name ?? t.title ?? ""),
      image: t.coverImage ?? t.image ?? undefined,
      description: t.description ?? undefined,
      type: t.type ?? undefined,
      year: t.releaseYear ?? t.year ?? undefined,
      rating: t.rating ?? undefined,
    })).filter((r: any) => r.id && r.title);

    return NextResponse.json(results, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Search proxy error" }, { status: 500 });
  }
}


