import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const message = result
    .array()
    .map((error) => error.msg)
    .join(", ");

  return next(new ApiError(422, message));
}
