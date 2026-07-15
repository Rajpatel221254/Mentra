import multer from "multer";
import { ApiError } from "../utils/api-error.js";
import {
  ALLOWED_FILE_MIMES,
  MAX_FILE_SIZE,
} from "../constants/learning.constants.js";

// Generic upload (used for avatars, etc.)
export const upload = multer({ storage: multer.memoryStorage() });

// Configured upload for resource files (validates type + size)
export const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_FILE_MIMES.includes(file.mimetype)) {
      return cb(
        new ApiError(
          422,
          `File type "${file.mimetype}" is not allowed. Accepted types: images, PDF, Word, Excel, PowerPoint, ZIP, video, text.`,
        ),
      );
    }
    cb(null, true);
  },
});