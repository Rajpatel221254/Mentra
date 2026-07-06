import { config } from "../config/config.js";
import storageService from "../services/storage.service.js";
import {
  changePassword,
  forgotPassword,
  googleLogin,
  loginUser,
  logoutAllSessions,
  logoutCurrentSession,
  refreshSession,
  registerUser,
  resendVerification,
  resetPassword,
  toPublicUser,
  verifyEmail,
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { clearRefreshCookie, setRefreshCookie } from "../utils/cookie.js";

export const registerController = asyncHandler(async (req, res) => {
  const result = await registerUser({
    body: req.body,
    file: req.file,
    uploadFile: storageService.uploadFile.bind(storageService),
  });

  res.status(201).json({
    message: "User registered successfully. Please verify your email.",
    success: true,
    ...result,
  });
});

export const verifyEmailController = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;
  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const user = await verifyEmail(token);

  res.status(200).json({
    message: "Email verified successfully",
    success: true,
    user,
  });
});

export const resendVerificationController = asyncHandler(async (req, res) => {
  await resendVerification(req.body.email);

  res.status(200).json({
    message:
      "If this account exists and is unverified, a new verification email has been sent.",
    success: true,
  });
});

export const loginController = asyncHandler(async (req, res) => {
  const result = await loginUser({
    email: req.body.email,
    password: req.body.password,
    req,
  });

  setRefreshCookie(res, result.refreshToken);

  res.status(200).json({
    message: "Login successful",
    success: true,
    accessToken: result.accessToken,
    user: result.user,
  });
});

export const refreshController = asyncHandler(async (req, res) => {
  const result = await refreshSession(
    req.cookies?.[config.REFRESH_TOKEN_COOKIE_NAME],
    req,
  );

  setRefreshCookie(res, result.refreshToken);

  res.status(200).json({
    message: "Token refreshed successfully",
    success: true,
    accessToken: result.accessToken,
    user: result.user,
  });
});

export const logoutController = asyncHandler(async (req, res) => {
  await logoutCurrentSession(req.cookies?.[config.REFRESH_TOKEN_COOKIE_NAME]);
  clearRefreshCookie(res);

  res.status(200).json({
    message: "Logout successful",
    success: true,
  });
});

export const logoutAllController = asyncHandler(async (req, res) => {
  await logoutAllSessions(req.user._id);
  clearRefreshCookie(res);

  res.status(200).json({
    message: "Logged out from all devices",
    success: true,
  });
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  await forgotPassword(req.body.email);

  res.status(200).json({
    message: "If this email exists, a password reset email has been sent.",
    success: true,
  });
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  await resetPassword({
    token: req.body.token,
    password: req.body.password,
  });

  clearRefreshCookie(res);

  res.status(200).json({
    message: "Password reset successfully",
    success: true,
  });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  await changePassword({
    userId: req.user._id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });

  clearRefreshCookie(res);

  res.status(200).json({
    message: "Password changed successfully. Please log in again.",
    success: true,
  });
});

export const googleAuthController = asyncHandler(async (req, res) => {
  const result = await googleLogin({
    idToken: req.body.idToken,
    req,
  });

  setRefreshCookie(res, result.refreshToken);

  res.status(200).json({
    message: "Google authentication successful",
    success: true,
    accessToken: result.accessToken,
    user: result.user,
  });
});

export const getMeController = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: await toPublicUser(req.user),
  });
});
