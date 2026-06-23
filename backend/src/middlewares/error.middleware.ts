import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error instanceof ZodError ? 400 : 500;
    const message = error.message || "Internal Server Error";
    error = new AppError(statusCode, message, false, err.stack);
  }

  const { statusCode, message } = error as AppError;

  res.locals.errorMessage = error.message;

  const response = {
    code: statusCode,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (env.NODE_ENV === "development") {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }

  res.status(statusCode).send(response);
};
