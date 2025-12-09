import request from "supertest";
import { describe, expect, test } from "vitest";
import { z } from "zod";
import app from "../src/app";
import User from "../src/modules/user/user.model";

const authSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      role: z.enum(["user", "admin"])
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
    role: z.enum(["user", "admin"])
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

describe("Auth API", () => {
  test("register should create a user and issue tokens", async () => {
    const response = await request(app).post("/auth/register").send(testUser);

    expect(response.status).toBe(201);
    const body = authSuccessSchema.parse(response.body);
    expect(body.data.user).toMatchObject({
      email: testUser.email.toLowerCase(),
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      role: "user"
    });
    expect(response.headers["set-cookie"]).toBeDefined();

    const userInDb = await User.findOne({ email: testUser.email.toLowerCase() });
    expect(userInDb).not.toBeNull();
  });

  test("login should return tokens for valid credentials", async () => {
    await request(app).post("/auth/register").send(testUser);

    const response = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    const body = authSuccessSchema.parse(response.body);
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();
  });

  test("login should return 401 for wrong password", async () => {
    await request(app).post("/auth/register").send(testUser);

    const response = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: "WrongPassword1" });

    expect(response.status).toBe(401);
    const body = errorResponseSchema.parse(response.body);
    expect(body.error.message).toMatch(/invalid credentials/i);
  });

  test("me endpoint should return user profile with valid access token", async () => {
    const registerResponse = await request(app).post("/auth/register").send(testUser);
    const registerBody = authSuccessSchema.parse(registerResponse.body);
    const accessToken = registerBody.data.tokens.accessToken;

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    const body = userSuccessSchema.parse(response.body);
    expect(body.data.email).toBe(testUser.email.toLowerCase());
  });

  test("refresh should issue new tokens when provided a valid refresh token", async () => {
    const registerResponse = await request(app).post("/auth/register").send(testUser);
    const registerBody = authSuccessSchema.parse(registerResponse.body);
    const refreshToken = registerBody.data.tokens.refreshToken;
    const setCookieHeader = registerResponse.headers["set-cookie"];
    const cookies: string[] = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];

    const response = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookies)
      .send({ refreshToken });

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
    const registerResponse = await request(app).post("/auth/register").send(testUser);
    const setCookieHeader = registerResponse.headers["set-cookie"];
    const cookies: string[] = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];

    const response = await request(app)
      .post("/auth/logout")
      .set("Cookie", cookies)
      .send();

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
