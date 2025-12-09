import type { NextFunction, Request, Response } from "express";
import config from "../../config/env";
import { AuthenticationError, ValidationError } from "../../utils/errors";
import { ttlToMilliseconds } from "../../utils/time";
import { AuthService } from "./auth.service";
import { loginSchema, refreshSchema, registerSchema, verifyEmailSchema } from "./auth.validators";

const REFRESH_COOKIE_NAME = "rt";
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: config.cors.cookieSecure,
  path: "/auth/refresh",
  maxAge: ttlToMilliseconds(config.jwt.refreshTtl)
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...refreshCookieOptions,
    maxAge: undefined
  });
};

const extractBodyRefreshToken = (req: Request): string | undefined => {
  if (typeof req.body !== "object" || req.body === null) {
    return undefined;
  }
  const candidate = (req.body as Record<string, unknown>).refreshToken;
  return typeof candidate === "string" ? candidate : undefined;
};

const extractCookieRefreshToken = (req: Request): string | undefined => {
  const cookies = req.cookies;
  if (typeof cookies !== "object" || cookies === null) {
    return undefined;
  }
  const candidate = (cookies as Record<string, unknown>)[REFRESH_COOKIE_NAME];
  return typeof candidate === "string" ? candidate : undefined;
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await AuthService.register(payload);
    res.status(202).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await AuthService.login(payload);
    setRefreshCookie(res, result.tokens.refreshToken);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodyToken = extractBodyRefreshToken(req);
    const cookieToken = extractCookieRefreshToken(req);
    const candidate = bodyToken ?? cookieToken;
    if (!candidate) {
      throw new ValidationError("Refresh token is required");
    }

    const { refreshToken } = refreshSchema.parse({ refreshToken: candidate });

    const result = await AuthService.refresh(refreshToken);
    setRefreshCookie(res, result.tokens.refreshToken);
    res.status(200).json({
      success: true,
      data: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodyToken = extractBodyRefreshToken(req);
    const cookieToken = extractCookieRefreshToken(req);
    await AuthService.logout(bodyToken ?? cookieToken, req.user?.id);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const me = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = verifyEmailSchema.parse(req.body);
    const result = await AuthService.verifyEmail(payload);
    setRefreshCookie(res, result.tokens.refreshToken);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
