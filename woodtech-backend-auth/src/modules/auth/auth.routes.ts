import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import config from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { login, logout, me, refresh, register, verifyEmail } from "./auth.controller";

const baseLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: "Too many requests"
      }
    });
  }
});

const sensitiveLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.min(config.rateLimit.sensitiveMax, config.rateLimit.max),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: "Too many attempts, please try again later"
      }
    });
  }
});

const router = Router();

const asyncHandler =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

router.use(baseLimiter);

router.post("/register", sensitiveLimiter, asyncHandler(register));
router.post("/login", sensitiveLimiter, asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));
router.post("/verify-email", sensitiveLimiter, asyncHandler(verifyEmail));
router.get("/me", asyncHandler(requireAuth), asyncHandler(me));

export default router;
