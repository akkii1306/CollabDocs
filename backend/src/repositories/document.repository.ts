import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export class DocumentRepository {
  async create(data: Prisma.DocumentUncheckedCreateInput) {
    return prisma.document.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
    });
  }

  async findByWorkspaceId(workspaceId: string) {
    return prisma.document.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async update(id: string, data: Prisma.DocumentUpdateInput) {
    return prisma.document.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.document.delete({
      where: { id },
    });
  }

  async saveVersion(documentId: string, contentSnapshot: string, createdBy: string) {
    return prisma.documentVersion.create({
      data: {
        documentId,
        contentSnapshot,
        createdBy,
      },
    });
  }

  async getVersions(documentId: string) {
    return prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getVersionById(versionId: string) {
    return prisma.documentVersion.findUnique({
      where: { id: versionId },
    });
  }
}
