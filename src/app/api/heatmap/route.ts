import { NextRequest, NextResponse } from "next/server";
import { connectDB, isMongoError } from "@/lib/mongodb";
import Event from "@/models/Event";
import { ClickPoint, ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page_url = searchParams.get("page_url");

    if (!page_url) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "page_url query param is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const clicks = await Event.find({
      page_url,
      event_type: "click",
      x: { $exists: true, $ne: null },
      y: { $exists: true, $ne: null },
    })
      .select("x y timestamp viewport_width viewport_height -_id")
      .sort({ timestamp: -1 })
      .limit(2000) // cap for canvas performance
      .lean();

    const data: ClickPoint[] = clicks.map((c) => ({
      x: c.x!,
      y: c.y!,
      timestamp: c.timestamp.toISOString(),
      viewport_width: c.viewport_width,
      viewport_height: c.viewport_height,
    }));

    return NextResponse.json<ApiResponse<ClickPoint[]>>({
      success: true,
      data,
    });
  } catch (err) {
    console.error("[GET /api/heatmap]", err);
    if (isMongoError(err)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Database unavailable. Check MONGODB_URI in .env.local.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
