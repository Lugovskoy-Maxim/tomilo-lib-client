import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  // Validate required params
  if (!year || !month) {
    return NextResponse.json(
      { success: false, message: "Missing 'year' or 'month' parameter" },
      { status: 400 }
    );
  }

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  // Validate year and month ranges
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return NextResponse.json(
      { success: false, message: "Invalid year. Must be between 2000 and 2100" },
      { status: 400 }
    );
  }

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return NextResponse.json(
      { success: false, message: "Invalid month. Must be between 1 and 12" },
      { status: 400 }
    );
  }

  try {
    const url = new URL("/stats/monthly", API_BASE);
    url.searchParams.set("year", year);
    url.searchParams.set("month", month);

    const res = await fetch(url.toString(), {
      cache: "no-store",
      next: { revalidate: 0 },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to fetch monthly stats" }));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to fetch monthly stats" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Monthly stats API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
