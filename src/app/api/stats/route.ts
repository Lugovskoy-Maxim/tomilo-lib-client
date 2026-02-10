import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeHistory = searchParams.get("includeHistory") === "true";
  const historyDays = searchParams.get("historyDays");

  try {
    const url = new URL("/stats", API_BASE);
    
    // Forward query params to backend
    if (includeHistory) {
      url.searchParams.set("includeHistory", "true");
    }
    if (historyDays) {
      url.searchParams.set("historyDays", historyDays);
    }

    const res = await fetch(url.toString(), {
      cache: "no-store",
      next: { revalidate: 0 },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to fetch stats" }));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to fetch stats" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
