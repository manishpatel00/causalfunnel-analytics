import { NextRequest, NextResponse } from "next/server";
import { connectDB, isMongoError } from "@/lib/mongodb";
import Event from "@/models/Event";
import { EventRecord, ApiResponse } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId || sessionId.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "sessionId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const events = await Event.find({ session_id: sessionId })
      .sort({ timestamp: 1 })
      .select("-__v")
      .lean();

    const data: EventRecord[] = events.map((e) => ({
      _id: String(e._id),
      session_id: e.session_id,
      event_type: e.event_type,
      page_url: e.page_url,
      timestamp: e.timestamp.toISOString(),
      ...(e.x !== undefined && { x: e.x }),
      ...(e.y !== undefined && { y: e.y }),
      ...(e.viewport_width && { viewport_width: e.viewport_width }),
      ...(e.viewport_height && { viewport_height: e.viewport_height }),
      ...(e.user_agent && { user_agent: e.user_agent }),
      ...(e.referrer && { referrer: e.referrer }),
    }));

    return NextResponse.json<ApiResponse<EventRecord[]>>({
      success: true,
      data,
    });
  } catch (err) {
    console.error("[GET /api/sessions/:id]", err);
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
