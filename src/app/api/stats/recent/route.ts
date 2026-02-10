import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = searchParams.get("days");

  // Validate required params
  if (!days) {
    return NextResponse.json(
      { success: false, message: "Missing 'days' parameter" },
      { status: 400 }
    );
  }

  const daysNum = parseInt(days, 10);

  // Validate days range
  if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
    return NextResponse.json(
      { success: false, message: "Invalid days. Must be between 1 and 365" },
      { status: 400 }
    );
  }

  try {
    const url = new URL("/stats/recent", API_BASE);
    url.searchParams.set("days", days);

    const res = await fetch(url.toString(), {
      cache: "no-store",
      next: { revalidate: 0 },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to fetch recent stats" }));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to fetch recent stats" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Recent stats API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
