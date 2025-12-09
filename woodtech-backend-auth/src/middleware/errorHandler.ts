import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../config/logger";
import { AppError } from "../utils/errors";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = err.flatten();
  }

  if (statusCode >= 500) {
    logger.error({ err }, "Unhandled error");
  } else {
    logger.warn({ err }, "Handled error");
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details
    }
  });
};
