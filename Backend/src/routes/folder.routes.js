import express from "express";
import {
  createFolderController,
  deleteFolderController,
  getFolderController,
  getFolderTreeController,
  moveFolderController,
  renameFolderController,
  reorderFoldersController,
} from "../controllers/folder.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createFolderValidator,
  folderIdValidator,
  folderTreeValidator,
  moveFolderValidator,
  reorderFoldersValidator,
  updateFolderValidator,
} from "../validators/folder.validator.js";

const folderRouter = express.Router();

folderRouter.use(authenticate);

// Create folder
folderRouter.post(
  "/",
  createFolderValidator,
  validateRequest,
  createFolderController,
);

// Get folder tree for a subject
folderRouter.get(
  "/tree/:subjectId",
  folderTreeValidator,
  validateRequest,
  getFolderTreeController,
);

// Reorder folders (placed before /:id to avoid param conflict)
folderRouter.patch(
  "/reorder",
  reorderFoldersValidator,
  validateRequest,
  reorderFoldersController,
);

// Get single folder with children
folderRouter.get(
  "/:id",
  folderIdValidator,
  validateRequest,
  getFolderController,
);

// Rename folder
folderRouter.patch(
  "/:id",
  updateFolderValidator,
  validateRequest,
  renameFolderController,
);

// Delete folder (recursive)
folderRouter.delete(
  "/:id",
  folderIdValidator,
  validateRequest,
  deleteFolderController,
);

// Move folder
folderRouter.patch(
  "/:id/move",
  moveFolderValidator,
  validateRequest,
  moveFolderController,
);

export default folderRouter;
