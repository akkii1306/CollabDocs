import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export class WorkspaceRepository {
  async create(data: Prisma.WorkspaceCreateInput, ownerId: string) {
    return prisma.workspace.create({
      data: {
        ...data,
        members: {
          create: {
            userId: ownerId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
  }

  async addMember(workspaceId: string, userId: string, role: "EDITOR" | "VIEWER") {
    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
    });
  }

  async findMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
  }
}
