import "dotenv/config";
import { z, ZodError } from "zod";

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((origin) => String(origin)).filter(Boolean);
    }
  } catch (error) {
    // Fallback to comma separated values
  }

  return trimmed
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4001),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  CORS_ORIGINS: z.string().optional(),
  COOKIE_SECURE: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_SENSITIVE_MAX: z.coerce.number().default(5),
  MAIL_SERVICE_URL: z.string().url().default("http://localhost:4600")
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env as unknown);
} catch (error) {
  if (error instanceof ZodError) {
    console.error("Invalid environment configuration", error.flatten().fieldErrors);
  } else {
    console.error("Invalid environment configuration", error);
  }
  process.exit(1);
}

const origins = parseOrigins(env.CORS_ORIGINS);

const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  port: env.PORT,
  cors: {
    origins,
    cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE.toLowerCase() === "true" : env.NODE_ENV === "production"
  },
  db: {
    uri: env.MONGODB_URI
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.ACCESS_TOKEN_TTL,
    refreshTtl: env.REFRESH_TOKEN_TTL
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    sensitiveMax: env.RATE_LIMIT_SENSITIVE_MAX
  },
  services: {
    mailServiceUrl: env.MAIL_SERVICE_URL
  }
};

export type AppConfig = typeof config;

export default config;
