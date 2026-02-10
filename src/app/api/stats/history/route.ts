import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const days = searchParams.get("days");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  // Validate required params
  if (!type || !["daily", "monthly", "yearly"].includes(type)) {
    return NextResponse.json(
      { success: false, message: "Invalid or missing 'type' parameter. Must be 'daily', 'monthly', or 'yearly'" },
      { status: 400 }
    );
  }

  try {
    const url = new URL("/stats/history", API_BASE);
    url.searchParams.set("type", type);
    
    if (days) url.searchParams.set("days", days);
    if (year) url.searchParams.set("year", year);
    if (month) url.searchParams.set("month", month);

    const res = await fetch(url.toString(), {
      cache: "no-store",
      next: { revalidate: 0 },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to fetch stats history" }));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to fetch stats history" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Stats history API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
