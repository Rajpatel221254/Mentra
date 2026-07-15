import express from "express";
import { searchResourcesController } from "../controllers/resource.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { searchResourcesValidator } from "../validators/resource.validator.js";

const resourceRouter = express.Router();

resourceRouter.use(authenticate);

// Search resources within a subject
resourceRouter.get(
  "/search/:subjectId",
  searchResourcesValidator,
  validateRequest,
  searchResourcesController,
);

export default resourceRouter;
