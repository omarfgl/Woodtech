import crypto from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import config from "../config/env";
import { ttlToMilliseconds } from "./time";

export type TokenPayload = {
  sub: string;
  email: string;
  role: "user" | "admin";
  jti?: string;
};

export type AccessTokenPayload = TokenPayload & JwtPayload;
export type RefreshTokenPayload = TokenPayload & JwtPayload;

export const signAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: Math.floor(ttlToMilliseconds(config.jwt.accessTtl) / 1000)
  };
  return jwt.sign(
    { sub: payload.sub, email: payload.email, role: payload.role },
    config.jwt.accessSecret,
    options
  );
};

export const signRefreshToken = (payload: TokenPayload, jti: string): string => {
  const options: SignOptions = {
    expiresIn: Math.floor(ttlToMilliseconds(config.jwt.refreshTtl) / 1000),
    jwtid: jti
  };
  return jwt.sign(
    { sub: payload.sub, email: payload.email, role: payload.role },
    config.jwt.refreshSecret,
    options
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
};

export const generateTokenId = (): string => crypto.randomUUID();

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
