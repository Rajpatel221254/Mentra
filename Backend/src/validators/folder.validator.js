import { body, param } from "express-validator";
import {
  ALLOWED_COLORS,
  ALLOWED_ICONS,
} from "../constants/learning.constants.js";

export const folderIdValidator = [
  param("id").isMongoId().withMessage("Folder id is invalid"),
];

export const createFolderValidator = [
  body("subject").isMongoId().withMessage("Subject id is invalid"),
  body("parentFolder")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Parent folder id is invalid"),
  body("title")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Folder title must be between 2 and 80 characters"),
  body("color")
    .optional()
    .isIn(ALLOWED_COLORS)
    .withMessage("Folder color is not allowed"),
  body("icon")
    .optional()
    .isIn(ALLOWED_ICONS)
    .withMessage("Folder icon is not allowed"),
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be 0 or greater"),
];

export const updateFolderValidator = [
  ...folderIdValidator,
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Folder title must be between 2 and 80 characters"),
  body("color")
    .optional()
    .isIn(ALLOWED_COLORS)
    .withMessage("Folder color is not allowed"),
  body("icon")
    .optional()
    .isIn(ALLOWED_ICONS)
    .withMessage("Folder icon is not allowed"),
];

export const moveFolderValidator = [
  ...folderIdValidator,
  body("targetParentId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Target parent folder id is invalid"),
];

export const reorderFoldersValidator = [
  body("subjectId").isMongoId().withMessage("Subject id is invalid"),
  body("parentFolderId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Parent folder id is invalid"),
  body("folders")
    .isArray({ min: 1 })
    .withMessage("Folders must be a non-empty array"),
  body("folders.*.id").isMongoId().withMessage("Folder id is invalid"),
  body("folders.*.order")
    .isInt({ min: 0 })
    .withMessage("Order must be 0 or greater"),
];

export const folderTreeValidator = [
  param("subjectId").isMongoId().withMessage("Subject id is invalid"),
];
