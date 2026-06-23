import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { AuthRequest } from "../types";

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError(401, "Not authorized to access this route"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError(401, "Not authorized to access this route"));
  }
};
