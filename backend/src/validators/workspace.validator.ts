import { z } from "zod";

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
  }),
  params: z.object({
    id: z.string().uuid("Invalid workspace ID"),
  }),
});
