import { Router } from "express";
import * as documentController from "../controllers/document.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentIdSchema,
  restoreVersionSchema,
} from "../validators/document.validator";

const router = Router();

router.use(protect);

router.post("/", validate(createDocumentSchema), documentController.createDocument);
router.get("/", documentController.getDocuments);
router.get("/:id", validate(documentIdSchema), documentController.getDocumentById);
router.patch("/:id", validate(updateDocumentSchema), documentController.updateDocument);
router.delete("/:id", validate(documentIdSchema), documentController.deleteDocument);

router.get("/:id/history", validate(documentIdSchema), documentController.getVersions);
router.post("/:id/restore", validate(restoreVersionSchema), documentController.restoreVersion);

export default router;
