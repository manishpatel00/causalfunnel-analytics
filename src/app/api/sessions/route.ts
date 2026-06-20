import { NextResponse } from "next/server";
import { connectDB, isMongoError } from "@/lib/mongodb";
import Event from "@/models/Event";
import { SessionSummary, ApiResponse } from "@/types";

export async function GET() {
  try {
    await connectDB();

    const sessions = await Event.aggregate([
      {
        $group: {
          _id: "$session_id",
          total_events: { $sum: 1 },
          page_views: {
            $sum: { $cond: [{ $eq: ["$event_type", "page_view"] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] },
          },
          first_seen: { $min: "$timestamp" },
          last_seen: { $max: "$timestamp" },
          pages_visited: { $addToSet: "$page_url" },
        },
      },
      {
        $addFields: {
          duration_ms: { $subtract: ["$last_seen", "$first_seen"] },
        },
      },
      { $sort: { last_seen: -1 } },
      { $limit: 500 },
    ]);

    const data: SessionSummary[] = sessions.map((s) => ({
      session_id: s._id as string,
      total_events: s.total_events as number,
      page_views: s.page_views as number,
      clicks: s.clicks as number,
      first_seen: (s.first_seen as Date).toISOString(),
      last_seen: (s.last_seen as Date).toISOString(),
      pages_visited: s.pages_visited as string[],
      duration_seconds: Math.round((s.duration_ms as number) / 1000),
    }));

    return NextResponse.json<ApiResponse<SessionSummary[]>>({
      success: true,
      data,
    });
  } catch (err) {
    console.error("[GET /api/sessions]", err);
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
