import { body } from "express-validator";

export const passwordValidator = (field = "password", label = "Password") =>
  body(field)
    .isLength({ min: 8 })
    .withMessage(`${label} must be at least 8 characters long`)
    .matches(/[A-Z]/)
    .withMessage(`${label} must contain at least one uppercase letter`)
    .matches(/[a-z]/)
    .withMessage(`${label} must contain at least one lowercase letter`)
    .matches(/[0-9]/)
    .withMessage(`${label} must contain at least one number`);

export const registerValidator = [
  body("username").trim().isLength({ min: 3, max: 20 }),
  body("fullname").trim().notEmpty().isLength({ max: 50 }),
  body("email").isEmail().normalizeEmail(),
  passwordValidator(),
  body("bio").optional().trim().isLength({ max: 250 }),
];

export const emailValidator = [body("token").optional().isString().notEmpty()];

export const resendVerificationValidator = [
  body("email").isEmail().normalizeEmail(),
];

export const loginValidator = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().notEmpty(),
];

export const forgetPasswordValidator = [
  body("email").isEmail().normalizeEmail(),
];

export const resetPasswordValidator = [
  body("token").isString().notEmpty(),
  passwordValidator(),
];

export const changePasswordValidator = [
  body("currentPassword").isString().notEmpty(),
  passwordValidator("newPassword", "New password"),
];

export const googleValidator = [body("idToken").isString().notEmpty()];
