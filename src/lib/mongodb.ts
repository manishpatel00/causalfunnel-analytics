import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/causalfunnel";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongoose ?? { conn: null, promise: null };
global.__mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000, // fail fast instead of hanging 30s
        connectTimeoutMS: 5000,
      })
      .catch((err) => {
        // Reset so the next request retries instead of hanging forever
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/** Returns a human-readable error when MongoDB is unreachable */
export function isMongoError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes("ECONNREFUSED") ||
    err.message.includes("ENOTFOUND") ||
    err.message.includes("Server selection timed out") ||
    err.message.includes("connect ETIMEDOUT")
  );
}
