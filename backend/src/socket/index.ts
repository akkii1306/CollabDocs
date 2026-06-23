import { Server, Socket } from "socket.io";
import logger from "../config/logger";
import { DocumentService } from "../services/document.service";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

import * as Y from "yjs";

const documentService = new DocumentService();

// In-memory Yjs documents
const activeDocs = new Map<string, Y.Doc>();

interface UserPayload {
  id: string;
  email: string;
}

export default function setupSocket(io: Server) {
  // Middleware for Socket Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
      (socket as any).user = decoded;
      next();
    } catch (error) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as UserPayload;
    logger.info(`User connected to socket: ${user.id} (${socket.id})`);

    // Join a document room
    socket.on("join-document", (documentId: string) => {
      socket.join(documentId);
      logger.info(`User ${user.id} joined document ${documentId}`);

      // Broadcast to others in the room that this user joined
      socket.to(documentId).emit("user-joined", {
        userId: user.id,
        socketId: socket.id,
      });

      // Handle Yjs sync
      const isFirst = !activeDocs.has(documentId);
      if (isFirst) {
        activeDocs.set(documentId, new Y.Doc());
      }

      const ydoc = activeDocs.get(documentId)!;
      const state = Y.encodeStateAsUpdate(ydoc);
      
      socket.emit("yjs-sync", {
        state: Array.from(state),
        isFirst,
      });
    });

    // Leave a document room
    socket.on("leave-document", (documentId: string) => {
      socket.leave(documentId);
      socket.to(documentId).emit("user-left", {
        userId: user.id,
        socketId: socket.id,
      });

      // Clear Y.Doc from memory if room is empty
      const room = io.sockets.adapter.rooms.get(documentId);
      if (!room || room.size === 0) {
        activeDocs.delete(documentId);
        logger.info(`Cleared Y.Doc from memory for document ${documentId}`);
      }
    });

    // Handle Yjs document updates
    socket.on("yjs-update", (data: { documentId: string; update: number[] }) => {
      const ydoc = activeDocs.get(data.documentId);
      if (ydoc) {
        Y.applyUpdate(ydoc, new Uint8Array(data.update));
        // Broadcast the update to everyone else in the room
        socket.to(data.documentId).emit("yjs-update", data.update);
      }
    });

    // Handle cursor movement
    socket.on("cursor-update", (data: { documentId: string; cursor: any }) => {
      socket.to(data.documentId).emit("cursor-update", {
        userId: user.id,
        cursor: data.cursor,
      });
    });

    // Autosave document content (manual save from frontend triggers this)
    socket.on("save-document", async (data: { documentId: string; content: string }) => {
      try {
        await documentService.updateDocument(data.documentId, user.id, { content: data.content });
        // Save a version snapshot
        await documentService.saveVersion(data.documentId, user.id, data.content);
        
        socket.emit("save-success", { documentId: data.documentId, timestamp: new Date() });
      } catch (error) {
        logger.error(`Error saving document ${data.documentId}:`, error);
        socket.emit("save-error", { documentId: data.documentId, error: "Failed to save document" });
      }
    });

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${user.id} (${socket.id})`);
      // User is automatically removed from rooms on disconnect.
    });
  });
}
