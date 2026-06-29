import axios from "axios";
import request from "supertest";
import { beforeEach, describe, expect, test, vi, type MockedFunction } from "vitest";
import { z } from "zod";
import app from "../src/app";
import PendingVerification from "../src/modules/auth/pendingVerification.model";
import User from "../src/modules/user/user.model";

vi.mock("axios", () => ({
  default: {
    post: vi.fn()
  }
}));

const axiosPostMock = axios.post as MockedFunction<typeof axios.post>;

const pendingSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.literal("pending_verification"),
    email: z.string().email()
  })
});

const authSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      role: z.enum(["user", "admin"]),
      emailVerified: z.boolean().optional()
    }),
    tokens: z.object({
      accessToken: z.string(),
      refreshToken: z.string()
    })
  })
});

const tokenSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string()
  })
});

const userSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(["user", "admin"]),
    emailVerified: z.boolean().optional()
  })
});

const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string()
  })
});

const testUser = {
  email: "john.doe@example.com",
  password: "Password123",
  firstName: "John",
  lastName: "Doe"
};

type VerificationMailPayload = {
  email: string;
  name?: string;
  verificationUrl: string;
  expiresInHours?: number;
};

const latestVerificationPayload = () => {
  const payload = axiosPostMock.mock.calls.at(-1)?.[1] as VerificationMailPayload | undefined;
  if (!payload) {
    throw new Error("No verification email payload was sent");
  }
  return payload;
};

const registerPending = async (overrides: Partial<typeof testUser> = {}) => {
  const payload = { ...testUser, ...overrides };
  const response = await request(app).post("/auth/register").send(payload);
  expect(response.status).toBe(202);
  return {
    body: pendingSuccessSchema.parse(response.body),
    email: payload.email.toLowerCase()
  };
};

const registerAndVerify = async (overrides: Partial<typeof testUser> = {}) => {
  const { email } = await registerPending(overrides);
  const verificationPayload = latestVerificationPayload();
  const verificationUrl = new URL(verificationPayload.verificationUrl);
  const token = verificationUrl.searchParams.get("token");

  expect(verificationUrl.pathname).toBe("/verify-email");
  expect(verificationUrl.searchParams.get("email")).toBe(email);
  expect(token).toMatch(/^[a-f0-9]{64}$/);

  const verifyResponse = await request(app).post("/auth/verify-email").send({ email, token });
  expect(verifyResponse.status).toBe(200);
  return authSuccessSchema.parse(verifyResponse.body);
};

beforeEach(() => {
  axiosPostMock.mockReset();
  axiosPostMock.mockResolvedValue({ data: { success: true } });
});

describe("Auth API", () => {
  test("register should create a pending verification and send a verification link", async () => {
    const { body, email } = await registerPending();

    expect(body.data).toMatchObject({
      status: "pending_verification",
      email
    });

    const userInDb = await User.findOne({ email });
    expect(userInDb).toBeNull();

    const pending = await PendingVerification.findOne({ email });
    expect(pending).not.toBeNull();
    expect(pending?.tokenHash).toMatch(/^[a-f0-9]{64}$/);

    const verificationPayload = latestVerificationPayload();
    expect(verificationPayload).toMatchObject({
      email,
      name: testUser.firstName,
      expiresInHours: 24
    });
    expect(verificationPayload.verificationUrl).toContain("/verify-email?");
  });

  test("login should return 401 while email verification is pending", async () => {
    await registerPending();

    const response = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(401);
    const body = errorResponseSchema.parse(response.body);
    expect(body.error.message).toMatch(/email not verified/i);
  });

  test("verify-email should create a user and issue tokens for a valid link token", async () => {
    const body = await registerAndVerify();

    expect(body.data.user).toMatchObject({
      email: testUser.email.toLowerCase(),
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      role: "user",
      emailVerified: true
    });
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();

    const userInDb = await User.findOne({ email: testUser.email.toLowerCase() });
    expect(userInDb?.verifiedAt).toBeInstanceOf(Date);

    const pending = await PendingVerification.findOne({ email: testUser.email.toLowerCase() });
    expect(pending).toBeNull();
  });

  test("verify-email should reject an invalid link token", async () => {
    const { email } = await registerPending();

    const response = await request(app)
      .post("/auth/verify-email")
      .send({ email, token: "0".repeat(64) });

    expect(response.status).toBe(401);
    const body = errorResponseSchema.parse(response.body);
    expect(body.error.message).toMatch(/invalid verification link/i);
  });

  test("login should return tokens for valid credentials after verification", async () => {
    await registerAndVerify();

    const response = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    const body = authSuccessSchema.parse(response.body);
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();
  });

  test("login should return 401 for wrong password", async () => {
    await registerAndVerify();

    const response = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: "WrongPassword1" });

    expect(response.status).toBe(401);
    const body = errorResponseSchema.parse(response.body);
    expect(body.error.message).toMatch(/invalid credentials/i);
  });

  test("me endpoint should return user profile with valid access token", async () => {
    const registerBody = await registerAndVerify();
    const accessToken = registerBody.data.tokens.accessToken;

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    const body = userSuccessSchema.parse(response.body);
    expect(body.data.email).toBe(testUser.email.toLowerCase());
  });

  test("refresh should issue new tokens when provided a valid refresh token", async () => {
    const registerBody = await registerAndVerify();
    const refreshToken = registerBody.data.tokens.refreshToken;

    const response = await request(app).post("/auth/refresh").send({ refreshToken });

    expect(response.status).toBe(200);
    const body = tokenSuccessSchema.parse(response.body);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  test("refresh should return 401 for invalid token", async () => {
    const response = await request(app).post("/auth/refresh").send({ refreshToken: "invalid" });

    expect(response.status).toBe(401);
    const body = errorResponseSchema.parse(response.body);
    expect(body.error.message).toMatch(/invalid/i);
  });

  test("logout should clear the refresh token cookie", async () => {
    const registerBody = await registerAndVerify();
    const refreshToken = registerBody.data.tokens.refreshToken;

    const response = await request(app).post("/auth/logout").send({ refreshToken });

    expect(response.status).toBe(204);
    const clearedHeader = response.headers["set-cookie"];
    const clearedCookies: string[] = Array.isArray(clearedHeader)
      ? clearedHeader
      : clearedHeader
        ? [clearedHeader]
        : [];
    const clearedCookie = clearedCookies.find((cookie) => cookie.startsWith("rt="));
    expect(clearedCookie).toBeDefined();
    expect(clearedCookie).toMatch(/rt=;/);
  });
});
