import { DocumentRepository } from "../repositories/document.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { AppError } from "../utils/AppError";

const documentRepository = new DocumentRepository();
const workspaceRepository = new WorkspaceRepository();

export class DocumentService {
  async createDocument(userId: string, data: { title: string; workspaceId: string }) {
    const workspace = await workspaceRepository.findById(data.workspaceId);
    if (!workspace) throw new AppError(404, "Workspace not found");

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) throw new AppError(403, "You do not have access to this workspace");

    return documentRepository.create({
      title: data.title,
      workspaceId: data.workspaceId,
      authorId: userId,
    });
  }

  async getDocumentsByWorkspace(workspaceId: string, userId: string) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) throw new AppError(404, "Workspace not found");

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) throw new AppError(403, "You do not have access to this workspace");

    return documentRepository.findByWorkspaceId(workspaceId);
  }

  async getDocumentById(documentId: string, userId: string) {
    const document = await documentRepository.findById(documentId);
    if (!document) throw new AppError(404, "Document not found");

    const workspace = await workspaceRepository.findById(document.workspaceId);
    if (!workspace) throw new AppError(404, "Workspace not found");

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) throw new AppError(403, "You do not have access to this document");

    return { ...document, userRole: member.role };
  }

  async updateDocument(documentId: string, userId: string, data: any) {
    const document = await documentRepository.findById(documentId);
    if (!document) throw new AppError(404, "Document not found");

    const workspace = await workspaceRepository.findById(document.workspaceId);
    if (!workspace) throw new AppError(404, "Workspace not found");

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) throw new AppError(403, "You do not have access to this document");
    if (member.role === "VIEWER") throw new AppError(403, "Viewers cannot edit documents");

    return documentRepository.update(documentId, data);
  }

  async deleteDocument(documentId: string, userId: string) {
    const document = await documentRepository.findById(documentId);
    if (!document) throw new AppError(404, "Document not found");

    const workspace = await workspaceRepository.findById(document.workspaceId);
    if (!workspace) throw new AppError(404, "Workspace not found");

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) throw new AppError(403, "You do not have access to this document");
    if (member.role !== "OWNER" && document.authorId !== userId) {
      throw new AppError(403, "Only owners or the document author can delete it");
    }

    await documentRepository.delete(documentId);
    return { message: "Document deleted successfully" };
  }

  async saveVersion(documentId: string, userId: string, content: string) {
    const document = await documentRepository.findById(documentId);
    if (!document) throw new AppError(404, "Document not found");

    return documentRepository.saveVersion(documentId, content, userId);
  }

  async getVersions(documentId: string, userId: string) {
    const document = await this.getDocumentById(documentId, userId);
    return documentRepository.getVersions(documentId);
  }

  async restoreVersion(documentId: string, versionId: string, userId: string) {
    const document = await this.getDocumentById(documentId, userId);
    const version = await documentRepository.getVersionById(versionId);
    
    if (!version || version.documentId !== documentId) {
      throw new AppError(404, "Version not found");
    }

    return documentRepository.update(documentId, { content: version.contentSnapshot });
  }
}
