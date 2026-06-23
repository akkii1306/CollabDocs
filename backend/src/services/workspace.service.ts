import { WorkspaceRepository } from "../repositories/workspace.repository";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";

const workspaceRepository = new WorkspaceRepository();
const userRepository = new UserRepository();

export class WorkspaceService {
  async createWorkspace(userId: string, data: { name: string; description?: string }) {
    return workspaceRepository.create(data, userId);
  }

  async getUserWorkspaces(userId: string) {
    return workspaceRepository.findByUserId(userId);
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    const workspace = await workspaceRepository.findById(workspaceId);
    
    if (!workspace) {
      throw new AppError(404, "Workspace not found");
    }

    const isMember = workspace.members.some((member) => member.userId === userId);
    if (!isMember) {
      throw new AppError(403, "You do not have access to this workspace");
    }

    return workspace;
  }

  async inviteMember(workspaceId: string, inviterId: string, email: string, role: "EDITOR" | "VIEWER") {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) throw new AppError(404, "Workspace not found");

    const inviter = workspace.members.find((member) => member.userId === inviterId);
    if (!inviter || inviter.role !== "OWNER") {
      throw new AppError(403, "Only workspace owners can invite members");
    }

    const userToInvite = await userRepository.findByEmail(email);
    if (!userToInvite) {
      throw new AppError(404, "User not found");
    }

    const existingMember = await workspaceRepository.findMember(workspaceId, userToInvite.id);
    if (existingMember) {
      throw new AppError(400, "User is already a member of this workspace");
    }

    await workspaceRepository.addMember(workspaceId, userToInvite.id, role);

    return { message: "User invited successfully" };
  }
}
