import express from "express";
import {
  uploadFileController,
  getFileController,
  deleteFileController,
  renameFileController,
  moveFileController,
  getFileDownloadUrlController,
  toggleFileFavoriteController,
  archiveFileController,
  restoreFileController,
} from "../controllers/file.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { fileUpload } from "../services/multer.service.js";
import {
  fileIdValidator,
  uploadFileValidator,
  renameFileValidator,
  moveFileValidator,
} from "../validators/file.validator.js";

const fileRouter = express.Router();

fileRouter.use(authenticate);

// Upload file (multer runs before validators since it parses multipart body)
fileRouter.post(
  "/",
  fileUpload.single("file"),
  uploadFileValidator,
  validateRequest,
  uploadFileController,
);

// Get file metadata
fileRouter.get("/:id", fileIdValidator, validateRequest, getFileController);

// Delete file (removes from S3 + DB)
fileRouter.delete(
  "/:id",
  fileIdValidator,
  validateRequest,
  deleteFileController,
);

// Rename file
fileRouter.patch(
  "/:id/rename",
  renameFileValidator,
  validateRequest,
  renameFileController,
);

// Move file
fileRouter.patch(
  "/:id/move",
  moveFileValidator,
  validateRequest,
  moveFileController,
);

// Download (signed URL)
fileRouter.get(
  "/:id/download",
  fileIdValidator,
  validateRequest,
  getFileDownloadUrlController,
);

// Toggle favorite
fileRouter.patch(
  "/:id/favorite",
  fileIdValidator,
  validateRequest,
  toggleFileFavoriteController,
);

// Archive
fileRouter.patch(
  "/:id/archive",
  fileIdValidator,
  validateRequest,
  archiveFileController,
);

// Restore
fileRouter.patch(
  "/:id/restore",
  fileIdValidator,
  validateRequest,
  restoreFileController,
);

export default fileRouter;
