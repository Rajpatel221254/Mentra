import { body, param } from "express-validator";
import {
  ALLOWED_COLORS,
  ALLOWED_ICONS,
} from "../constants/learning.constants.js";

export const subjectIdValidator = [
  param("id").isMongoId().withMessage("Subject id is invalid"),
];

export const createSubjectValidator = [
  body("workspace").isMongoId().withMessage("Workspace id is invalid"),
  body("title")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Subject title must be between 2 and 80 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be 500 characters or less"),
  body("color")
    .optional()
    .isIn(ALLOWED_COLORS)
    .withMessage("Subject color is not allowed"),
  body("icon")
    .optional()
    .isIn(ALLOWED_ICONS)
    .withMessage("Subject icon is not allowed"),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be 0 or greater"),
];

export const updateSubjectValidator = [
  ...subjectIdValidator,
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Subject title must be between 2 and 80 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be 500 characters or less"),
  body("color")
    .optional()
    .isIn(ALLOWED_COLORS)
    .withMessage("Subject color is not allowed"),
  body("icon")
    .optional()
    .isIn(ALLOWED_ICONS)
    .withMessage("Subject icon is not allowed"),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be 0 or greater"),
];

export const reorderSubjectsValidator = [
  body("workspaceId").isMongoId().withMessage("Workspace id is invalid"),
  body("subjects").isArray({ min: 1 }).withMessage("Subjects must be a non-empty array"),
  body("subjects.*.id").isMongoId().withMessage("Subject id is invalid"),
  body("subjects.*.order").isInt({ min: 0 }).withMessage("Order must be 0 or greater"),
];
