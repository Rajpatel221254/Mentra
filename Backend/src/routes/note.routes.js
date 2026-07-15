import express from "express";
import {
  createNoteController,
  getNoteController,
  updateNoteController,
  deleteNoteController,
  moveNoteController,
  toggleNoteFavoriteController,
  archiveNoteController,
  restoreNoteController,
} from "../controllers/note.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createNoteValidator,
  noteIdValidator,
  updateNoteValidator,
  moveNoteValidator,
} from "../validators/note.validator.js";

const noteRouter = express.Router();

noteRouter.use(authenticate);

// Create note
noteRouter.post(
  "/",
  createNoteValidator,
  validateRequest,
  createNoteController,
);

// Get note
noteRouter.get(
  "/:id",
  noteIdValidator,
  validateRequest,
  getNoteController,
);

// Update note (autosave-compatible)
noteRouter.patch(
  "/:id",
  updateNoteValidator,
  validateRequest,
  updateNoteController,
);

// Delete note
noteRouter.delete(
  "/:id",
  noteIdValidator,
  validateRequest,
  deleteNoteController,
);

// Move note
noteRouter.patch(
  "/:id/move",
  moveNoteValidator,
  validateRequest,
  moveNoteController,
);

// Toggle favorite
noteRouter.patch(
  "/:id/favorite",
  noteIdValidator,
  validateRequest,
  toggleNoteFavoriteController,
);

// Archive
noteRouter.patch(
  "/:id/archive",
  noteIdValidator,
  validateRequest,
  archiveNoteController,
);

// Restore
noteRouter.patch(
  "/:id/restore",
  noteIdValidator,
  validateRequest,
  restoreNoteController,
);

export default noteRouter;
