import http from "http";
import app from "./app";
import { env } from "./config/env";
import logger from "./config/logger";
import prisma from "./config/prisma";
import { Server } from "socket.io";
import setupSocket from "./socket";

const PORT = env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"],
  },
});

setupSocket(io);

async function startServer() {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (err: Error) => {
  logger.error("UNHANDLED REJECTION! Shutting down...");
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
