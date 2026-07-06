import express from "express";
import {
  createSubjectController,
  deleteSubjectController,
  getSubjectController,
  listWorkspaceSubjectsController,
  reorderSubjectsController,
  updateSubjectController,
} from "../controllers/subject.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  createSubjectValidator,
  reorderSubjectsValidator,
  subjectIdValidator,
  updateSubjectValidator,
} from "../validators/subject.validator.js"

const subjectRouter = express.Router();

subjectRouter.use(authenticate);

subjectRouter.post(
  "/",
  createSubjectValidator,
  validateRequest,
  createSubjectController,
);

subjectRouter.patch(
  "/reorder",
  reorderSubjectsValidator,
  validateRequest,
  reorderSubjectsController,
);

subjectRouter.get(
  "/:id",
  [subjectIdValidator],
  validateRequest,
  getSubjectController,
);

subjectRouter.patch(
  "/:id",
  updateSubjectValidator,
  validateRequest,
  updateSubjectController,
);

subjectRouter.delete(
  "/:id",
  [subjectIdValidator],
  validateRequest,
  deleteSubjectController,
);

export default subjectRouter;
