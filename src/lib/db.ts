import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGO_URI && process.env.MONGO_URI.trim().length > 0);
}

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim().length === 0) {
    console.warn('[MongoDB Admin] MONGO_URI is not set in environment variables.');
    return null;
  }

  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  if (!cached!.promise || mongoose.connection.readyState === 0) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    cached!.promise = mongoose
      .connect(uri, opts)
      .then((instance) => {
        console.log(`[MongoDB Admin] Connected successfully to host: ${instance.connection.host}`);
        return instance;
      })
      .catch((err) => {
        cached!.promise = null;
        cached!.conn = null;
        console.error('[MongoDB Admin] Connection failed:', err.message);
        throw err;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    cached!.conn = null;
    return null;
  }

  return cached!.conn;
}

export default connectDB;
