import { body, param } from "express-validator";

export const fileIdValidator = [
  param("id").isMongoId().withMessage("File id is invalid"),
];

export const uploadFileValidator = [
  body("folder").isMongoId().withMessage("Folder id is invalid"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("File title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be 1000 characters or less"),
  body("tags")
    .optional()
    .custom((value) => {
      // Tags may arrive as a JSON string when sent via multipart/form-data
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) && parsed.length <= 20;
        } catch {
          return false;
        }
      }
      return Array.isArray(value) && value.length <= 20;
    })
    .withMessage("Tags must be an array of up to 20 items"),
];

export const renameFileValidator = [
  ...fileIdValidator,
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("File title must be between 1 and 200 characters"),
];

export const moveFileValidator = [
  ...fileIdValidator,
  body("targetFolderId").isMongoId().withMessage("Target folder id is invalid"),
];
