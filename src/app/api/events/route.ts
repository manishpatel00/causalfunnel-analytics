import { NextRequest, NextResponse } from "next/server";
import { connectDB, isMongoError } from "@/lib/mongodb";
import Event from "@/models/Event";
import { EventPayload, ApiResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: EventPayload | EventPayload[] = await req.json();
    const events = Array.isArray(body) ? body : [body];

    if (events.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Empty payload" },
        { status: 400 }
      );
    }

    // Validate required fields
    for (const event of events) {
      if (!event.session_id || !event.event_type || !event.page_url) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Each event requires: session_id, event_type, page_url",
          },
          { status: 400 }
        );
      }
      if (!["page_view", "click"].includes(event.event_type)) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: `Unknown event_type: ${event.event_type}` },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const docs = events.map((e) => ({
      session_id: e.session_id.trim(),
      event_type: e.event_type,
      page_url: e.page_url,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      ...(e.x !== undefined && { x: Math.round(e.x) }),
      ...(e.y !== undefined && { y: Math.round(e.y) }),
      ...(e.viewport_width && { viewport_width: e.viewport_width }),
      ...(e.viewport_height && { viewport_height: e.viewport_height }),
      ...(e.user_agent && { user_agent: e.user_agent }),
      ...(e.referrer && { referrer: e.referrer }),
    }));

    await Event.insertMany(docs, { ordered: false });

    return NextResponse.json<ApiResponse<{ inserted: number }>>(
      { success: true, data: { inserted: docs.length } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/events]", err);
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
