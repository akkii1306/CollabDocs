import { z } from "zod";

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    workspaceId: z.string().uuid("Invalid workspace ID"),
  }),
});

export const updateDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    isStarred: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid("Invalid document ID"),
  }),
});

export const documentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid document ID"),
  }),
});

export const restoreVersionSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid document ID"),
  }),
  body: z.object({
    versionId: z.string().uuid("Invalid version ID"),
  }),
});
