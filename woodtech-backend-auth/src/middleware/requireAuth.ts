import type { NextFunction, Request, Response } from "express";
import { AuthenticationError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";
import User from "../modules/user/user.model";
import { AuthService } from "../modules/auth/auth.service";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AuthenticationError("Missing authorization header"));
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    req.user = AuthService.mapUserProfile(user);
    return next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return next(error);
    }
    return next(new AuthenticationError());
  }
};
