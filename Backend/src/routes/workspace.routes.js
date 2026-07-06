import express from "express";
import {
  archiveWorkspaceController,
  createWorkspaceController,
  deleteWorkspaceController,
  getWorkspaceController,
  listArchivedWorkspacesController,
  listWorkspacesController,
  restoreWorkspaceController,
  updateWorkspaceController,
} from "../controllers/workspace.controller.js";
import { listWorkspaceSubjectsController } from "../controllers/subject.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createWorkspaceValidator,
  listWorkspacesValidator,
  updateWorkspaceValidator,
  workspaceIdValidator,
  workspaceSubjectsValidator,
} from "../validators/workspace.validator.js";

const workspaceRouter = express.Router();

workspaceRouter.use(authenticate);

workspaceRouter.post(
  "/",
  createWorkspaceValidator,
  validateRequest,
  createWorkspaceController,
);

workspaceRouter.get("/", listWorkspacesValidator, validateRequest, listWorkspacesController);

workspaceRouter.get(
  "/archived",
  listWorkspacesValidator,
  validateRequest,
  listArchivedWorkspacesController,
);

workspaceRouter.get(
  "/:workspaceId/subjects",
  workspaceSubjectsValidator,
  validateRequest,
  listWorkspaceSubjectsController,
);

workspaceRouter.get(
  "/:id",
  [workspaceIdValidator],
  validateRequest,
  getWorkspaceController,
);

workspaceRouter.patch(
  "/:id",
  updateWorkspaceValidator,
  validateRequest,
  updateWorkspaceController,
);

workspaceRouter.delete(
  "/:id",
  [workspaceIdValidator],
  validateRequest,
  deleteWorkspaceController,
);

workspaceRouter.patch(
  "/:id/archive",
  [workspaceIdValidator],
  validateRequest,
  archiveWorkspaceController,
);

workspaceRouter.patch(
  "/:id/restore",
  [workspaceIdValidator],
  validateRequest,
  restoreWorkspaceController,
);

export default workspaceRouter;
