import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
  session_id: string;
  event_type: "page_view" | "click";
  page_url: string;
  timestamp: Date;
  x?: number;
  y?: number;
  viewport_width?: number;
  viewport_height?: number;
  user_agent?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

const EventSchema = new Schema<IEvent>(
  {
    session_id: { type: String, required: true, index: true },
    event_type: {
      type: String,
      enum: ["page_view", "click"],
      required: true,
      index: true,
    },
    page_url: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    x: { type: Number },
    y: { type: Number },
    viewport_width: { type: Number },
    viewport_height: { type: Number },
    user_agent: { type: String },
    referrer: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    collection: "events",
    timestamps: false,
  }
);

// Compound index for heatmap queries
EventSchema.index({ page_url: 1, event_type: 1 });
// Compound index for session journey
EventSchema.index({ session_id: 1, timestamp: 1 });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
