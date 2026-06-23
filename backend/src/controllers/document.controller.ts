import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { DocumentService } from "../services/document.service";

const documentService = new DocumentService();

export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await documentService.createDocument(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.query;
    const result = await documentService.getDocumentsByWorkspace(workspaceId as string, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await documentService.getDocumentById(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await documentService.updateDocument(id, userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await documentService.deleteDocument(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getVersions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await documentService.getVersions(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const restoreVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { versionId } = req.body;
    const result = await documentService.restoreVersion(id, versionId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
