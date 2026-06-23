import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware";
import { AppError } from "./utils/AppError";

const app: Express = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

import authRoutes from "./routes/auth.routes";
import workspaceRoutes from "./routes/workspace.routes";
import documentRoutes from "./routes/document.routes";

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/documents", documentRoutes);

// Unknown Routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(404, `Not found - ${req.originalUrl}`));
});

// Error Handling
app.use(errorHandler);

export default app;
