import { body, param } from "express-validator";
import { EDITOR_TYPES } from "../constants/learning.constants.js";

export const noteIdValidator = [
  param("id").isMongoId().withMessage("Note id is invalid"),
];

export const createNoteValidator = [
  body("folder").isMongoId().withMessage("Folder id is invalid"),
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Note title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be 1000 characters or less"),
  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string"),
  body("editorType")
    .optional()
    .isIn(EDITOR_TYPES)
    .withMessage(`Editor type must be one of: ${EDITOR_TYPES.join(", ")}`),
  body("coverImage")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cover image must be 500 characters or less"),
  body("icon")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Icon must be 100 characters or less"),
  body("tags")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Tags must be an array of up to 20 items"),
  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each tag must be between 1 and 50 characters"),
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be 0 or greater"),
];

export const updateNoteValidator = [
  ...noteIdValidator,
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Note title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be 1000 characters or less"),
  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string"),
  body("editorType")
    .optional()
    .isIn(EDITOR_TYPES)
    .withMessage(`Editor type must be one of: ${EDITOR_TYPES.join(", ")}`),
  body("coverImage")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cover image must be 500 characters or less"),
  body("icon")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Icon must be 100 characters or less"),
  body("tags")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Tags must be an array of up to 20 items"),
  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each tag must be between 1 and 50 characters"),
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be 0 or greater"),
];

export const moveNoteValidator = [
  ...noteIdValidator,
  body("targetFolderId").isMongoId().withMessage("Target folder id is invalid"),
];
