import { body, param, query } from "express-validator";
import {
  ALLOWED_COLORS,
  ALLOWED_ICONS,
} from "../constants/learning.constants.js";

export const workspaceIdValidator = [
  param("id").isMongoId().withMessage("Workspace id is invalid"),
];

export const workspaceSubjectsValidator = [
  param("workspaceId").isMongoId().withMessage("Workspace id is invalid"),
];

export const listWorkspacesValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("search").optional().trim().isLength({ max: 80 }),
  query("sort")
    .optional()
    .isIn(["newest", "oldest", "updated", "title_asc", "title_desc"])
    .withMessage("Sort value is invalid"),
];

export const createWorkspaceValidator = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Workspace title must be between 2 and 80 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be 500 characters or less"),
  body("color")
    .optional()
    .isIn(ALLOWED_COLORS)
    .withMessage("Workspace color is not allowed"),
  body("icon")
    .optional()
    .isIn(ALLOWED_ICONS)
    .withMessage("Workspace icon is not allowed"),
  body("coverImage")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cover image must be 500 characters or less"),
];

export const updateWorkspaceValidator = [
  ...workspaceIdValidator,
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Workspace title must be between 2 and 80 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be 500 characters or less"),
  body("color")
    .optional()
    .isIn(ALLOWED_COLORS)
    .withMessage("Workspace color is not allowed"),
  body("icon")
    .optional()
    .isIn(ALLOWED_ICONS)
    .withMessage("Workspace icon is not allowed"),
  body("coverImage")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cover image must be 500 characters or less"),
];
