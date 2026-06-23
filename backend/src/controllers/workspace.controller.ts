import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { WorkspaceService } from "../services/workspace.service";

const workspaceService = new WorkspaceService();

export const createWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await workspaceService.createWorkspace(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getWorkspaces = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await workspaceService.getUserWorkspaces(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await workspaceService.getWorkspaceById(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inviterId = req.user!.id;
    const { id } = req.params;
    const { email, role } = req.body;
    const result = await workspaceService.inviteMember(id, inviterId, email, role);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
