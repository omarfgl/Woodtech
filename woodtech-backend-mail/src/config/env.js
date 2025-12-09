import "dotenv/config";
import { z } from "zod";

// Validation stricte des variables d'environnement necessaires au service mail.
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4500),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  MAIL_FROM: z
    .string()
    .min(3)
    .refine(
      (value) => {
        const trimmed = value.trim();
        if (!trimmed) return false;
        if (trimmed.includes("<") && trimmed.includes(">")) {
          const match = trimmed.match(/<([^>]+)>/);
          if (!match) return false;
          return z.string().email().safeParse(match[1].trim()).success;
        }
        return z.string().email().safeParse(trimmed).success;
      },
      { message: "MAIL_FROM must be a valid email or formatted name <email@domain>" }
    )
    .default("notifications@woodtech.fr"),
  MAIL_TO: z.string().email().default("ceowoodtech0@gmail.com"),
  ALLOW_ORIGINS: z.string().optional(),
  EMAIL_USER: z.string().email().optional(),
  EMAIL_PASS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional()
});

const env = envSchema.parse(process.env);

// On convertit la liste ALLOW_ORIGINS en tableau utilisable par CORS.
const allowedOrigins = env.ALLOW_ORIGINS
  ? env.ALLOW_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : ["http://localhost:5173"];

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  port: env.PORT,
  corsOrigins: allowedOrigins,
  mail: {
    from: env.MAIL_FROM,
    to: env.MAIL_TO,
  },
  resendApiKey: env.RESEND_API_KEY,
  smtp: env.EMAIL_USER && env.EMAIL_PASS
    ? {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
        host: env.SMTP_HOST || "smtp.gmail.com",
        port: env.SMTP_PORT || 465,
        secure: true,
      }
    : null,
};

export default config;
