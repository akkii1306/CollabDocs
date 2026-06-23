import { Router } from "express";
import * as workspaceController from "../controllers/workspace.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createWorkspaceSchema, inviteMemberSchema } from "../validators/workspace.validator";

const router = Router();

router.use(protect);

router.post("/", validate(createWorkspaceSchema), workspaceController.createWorkspace);
router.get("/", workspaceController.getWorkspaces);
router.get("/:id", workspaceController.getWorkspaceById);
router.post("/:id/invite", validate(inviteMemberSchema), workspaceController.inviteMember);

export default router;
