import { param, query } from "express-validator";
import { RESOURCE_TYPES } from "../constants/learning.constants.js";

export const searchResourcesValidator = [
  param("subjectId").isMongoId().withMessage("Subject id is invalid"),
  query("q")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search query must be 200 characters or less"),
  query("type")
    .optional()
    .toUpperCase()
    .isIn(RESOURCE_TYPES)
    .withMessage(`Type must be one of: ${RESOURCE_TYPES.join(", ")}`),
  query("tags")
    .optional()
    .isString()
    .withMessage("Tags must be a comma-separated string"),
  query("favorite")
    .optional()
    .isIn(["true", "false"])
    .withMessage("Favorite must be true or false"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be at least 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("sort")
    .optional()
    .isIn(["newest", "oldest", "updated", "title_asc", "title_desc", "largest", "smallest"])
    .withMessage("Sort value is invalid"),
];
