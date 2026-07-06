import express from "express";
import { body } from "express-validator";
import {
  changePasswordController,
  forgotPasswordController,
  getMeController,
  googleAuthController,
  loginController,
  logoutAllController,
  logoutController,
  refreshController,
  registerController,
  resendVerificationController,
  resetPasswordController,
  verifyEmailController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { upload } from "../services/multer.service.js";
import {
  changePasswordValidator,
  emailValidator,
  forgetPasswordValidator,
  googleValidator,
  loginValidator,
  registerValidator,
  resendVerificationValidator,
  resetPasswordValidator,
} from "../validators/auth.validator.js";

const authRouter = express.Router();

authRouter.post(
  "/register",
  upload.single("avatar"),
  registerValidator,
  validateRequest,
  registerController,
);

authRouter.post(
  "/verify-email",
  emailValidator,
  validateRequest,
  verifyEmailController,
);

authRouter.post(
  "/resend-verification",
  resendVerificationValidator,
  validateRequest,
  resendVerificationController,
);

authRouter.post("/login", loginValidator, validateRequest, loginController);

authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);

authRouter.post(
  "/forgot-password",
  forgetPasswordValidator,
  validateRequest,
  forgotPasswordController,
);

authRouter.post(
  "/reset-password",
  resetPasswordValidator,
  validateRequest,
  resetPasswordController,
);

authRouter.post(
  "/change-password",
  authenticate,
  changePasswordValidator,
  validateRequest,
  changePasswordController,
);

authRouter.post(
  "/google",
  googleValidator,
  validateRequest,
  googleAuthController,
);

authRouter.post("/logout-all", authenticate, logoutAllController);
authRouter.get("/me", authenticate, getMeController);

export default authRouter;
