import { NextResponse } from "next/server";
import { connectDB, isMongoError } from "@/lib/mongodb";
import Event from "@/models/Event";
import crypto from "crypto";

// Helper to generate a random number within a range
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate clusters of clicks to make the heatmap look realistic
const CLUSTERS = [
  { name: "Primary CTA (Start free trial)", x: 600, y: 520, variance: 30, count: 40 },
  { name: "Secondary CTA (Watch demo)", x: 740, y: 520, variance: 30, count: 15 },
  { name: "Pricing - Starter", x: 400, y: 760, variance: 40, count: 10 },
  { name: "Pricing - Growth", x: 650, y: 760, variance: 40, count: 35 },
  { name: "Pricing - Enterprise", x: 900, y: 760, variance: 40, count: 5 },
  { name: "Header - Pricing", x: 750, y: 50, variance: 15, count: 12 },
];

export async function POST() {
  try {
    await connectDB();

    // Clear existing events
    await Event.deleteMany({});

    const now = Date.now();
    const demoUrl = "http://localhost:3000/demo";
    const newEvents = [];

    // Create 15 synthetic sessions
    for (let i = 0; i < 15; i++) {
      const sessionId = crypto.randomUUID();
      const sessionStart = now - rand(1000 * 60, 1000 * 60 * 60 * 24 * 7); // up to 7 days ago
      
      // Initial page view
      newEvents.push({
        session_id: sessionId,
        event_type: "page_view",
        page_url: demoUrl,
        timestamp: new Date(sessionStart),
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
      });

      // Randomly assign some clicks from the clusters to this session
      let clickTime = sessionStart;
      const numClicks = rand(1, 8);
      
      for (let j = 0; j < numClicks; j++) {
        clickTime += rand(1000, 15000); // 1-15 seconds between clicks
        const cluster = CLUSTERS[rand(0, CLUSTERS.length - 1)];
        
        newEvents.push({
          session_id: sessionId,
          event_type: "click",
          page_url: demoUrl,
          timestamp: new Date(clickTime),
          x: cluster.x + rand(-cluster.variance, cluster.variance),
          y: cluster.y + rand(-cluster.variance, cluster.variance),
          viewport_width: 1440,
          viewport_height: 900,
        });
      }
    }

    // Insert all the events
    await Event.insertMany(newEvents);

    return NextResponse.json({ success: true, message: `Inserted ${newEvents.length} events across 15 sessions.` });
  } catch (error) {
    if (isMongoError(error)) {
      return NextResponse.json(
        { success: false, error: "Database unavailable. Check MONGODB_URI in .env.local." },
        { status: 500 }
      );
    }
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: "Failed to seed data" }, { status: 500 });
  }
}
