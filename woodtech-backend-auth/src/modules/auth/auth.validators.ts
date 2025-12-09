import { z } from "zod";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[^\s]{8,}$/;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(passwordRegex, "Password must contain at least one letter and one number"),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
