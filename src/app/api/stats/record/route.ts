import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = req.headers.get("authorization");
    
    const url = new URL("/stats/record", API_BASE);
    
    const res = await fetch(url.toString(), {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { authorization: authHeader }),
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to record stats" }));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to record stats" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Record stats API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
