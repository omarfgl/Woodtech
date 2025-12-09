import { afterAll, afterEach, beforeAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT ?? "0";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? "test-access-secret-test-access-123456";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-test-refresh-123456";
process.env.ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? "15m";
process.env.REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL ?? "7d";
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? "[\"http://localhost:3000\"]";
process.env.COOKIE_SECURE = "false";
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ?? "60000";
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ?? "100";
process.env.RATE_LIMIT_SENSITIVE_MAX = process.env.RATE_LIMIT_SENSITIVE_MAX ?? "100";
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/woodtech-auth-test";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri("woodtech-auth-test");
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
