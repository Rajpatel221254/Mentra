import express from "express";
import {
  getMeController,
  loginController,
  registerController,
  verifyEmailController,
} from "../controllers/auth.controller.js";
import { upload } from "../services/multer.service.js";

const authRouter = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
authRouter.post("/login", loginController);

/**
 * @route POST /api/auth/register
 * @desc Register a user and send Email verification mail
 * @access Public
 */
authRouter.post("/register", upload.single("avatar"),registerController);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email
 * @access Public
 * @query { token }
 */
authRouter.post("/verify-email", verifyEmailController);

/**
 * @route GET /api/auth/get-me
 * @desc Get a loggedIn user
 * @access Private
 */
authRouter.post("/get-me", getMeController);

export default authRouter;
