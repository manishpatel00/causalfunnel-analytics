import { NextResponse } from "next/server";
import { connectDB, isMongoError } from "@/lib/mongodb";
import Event from "@/models/Event";
import { ApiResponse } from "@/types";

export async function GET() {
  try {
    await connectDB();
    const pages: string[] = await Event.distinct("page_url", {
      event_type: "click",
    });
    return NextResponse.json<ApiResponse<string[]>>({
      success: true,
      data: pages.sort(),
    });
  } catch (err) {
    console.error("[GET /api/pages]", err);
    const isDb = isMongoError(err);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: isDb
          ? "Database unavailable. Check MONGODB_URI in .env.local."
          : "Internal server error",
      },
      { status: isDb ? 503 : 500 }
    );
  }
}
