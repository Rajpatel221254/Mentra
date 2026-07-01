import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/config.js";
import userModel from "../models/user.model.js";
import SessionModel from "../models/session.model.js";
import VerificationTokenModel from "../models/verification-token.model.js";
import PasswordResetTokenModel from "../models/password-reset-token.model.js";
import { sendEmail } from "./mail.service.js";
import {
  addDays,
  addMinutes,
  createOpaqueToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyJwt,
} from "../utils/token.js";
import { ApiError } from "../utils/api-error.js";

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    provider: user.provider,
  };
}

function getRequestMeta(req) {
  return {
    userAgent: req.get("user-agent") || "",
    ipAddress: req.ip || req.socket?.remoteAddress || "",
  };
}

async function sendVerificationEmail(user) {
  await VerificationTokenModel.updateMany(
    { user: user._id, usedAt: null },
    { $set: { usedAt: new Date(), expiresAt: new Date() } },
  );

  const token = createOpaqueToken();
  await VerificationTokenModel.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: addMinutes(new Date(), 30),
  });

  const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your Mentra email",
    html: `
      <p>Hi ${user.username},</p>
      <p>Verify your email address to activate your Mentra account.</p>
      <p><a href="${verificationUrl}">Verify email</a></p>
      <p>This link expires in 30 minutes. If you did not create this account, you can ignore this email.</p>
    `,
    text: `Verify your Mentra email: ${verificationUrl}`,
  });
}

async function sendPasswordResetEmail(user) {
  await PasswordResetTokenModel.updateMany(
    { user: user._id, usedAt: null },
    { $set: { usedAt: new Date(), expiresAt: new Date() } },
  );

  const token = createOpaqueToken();
  await PasswordResetTokenModel.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: addMinutes(new Date(), 15),
  });

  const resetUrl = `${config.CLIENT_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Mentra password",
    html: `
      <p>Hi ${user.username},</p>
      <p>Use the link below to reset your password.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
    `,
    text: `Reset your Mentra password: ${resetUrl}`,
  });
}

async function createSession(user, req) {
  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = signRefreshToken(user, sessionId);

  await SessionModel.create({
    _id: sessionId,
    user: user._id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: addDays(new Date(), 7),
    ...getRequestMeta(req),
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

async function ensureUniqueUsername(baseUsername) {
  const sanitizedBase = (baseUsername || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 16) || "user";

  let username = sanitizedBase;
  let exists = await userModel.exists({ username });

  while (exists) {
    username = `${sanitizedBase}${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await userModel.exists({ username });
  }

  return username;
}

export async function registerUser({ body, file, uploadFile }) {
  const { username, fullname, email, password, bio } = body;

  const existingUser = await userModel.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const uploadedAvatar = file ? await uploadFile(file, "profilePhoto") : null;

  const user = await userModel.create({
    username,
    fullname,
    email,
    bio,
    password,
    avatar: uploadedAvatar?.key || null,
    isActive: false,
    isEmailVerified: false,
    provider: "local",
  });

  await sendVerificationEmail(user);

  return {
    user: publicUser(user),
    uploadFile: uploadedAvatar,
  };
}

export async function verifyEmail(token) {
  const tokenRecord = await VerificationTokenModel.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenRecord) {
    throw new ApiError(400, "Verification token is invalid or expired");
  }

  const user = await userModel.findById(tokenRecord.user);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isEmailVerified = true;
  user.isActive = true;
  await user.save();

  tokenRecord.usedAt = new Date();
  await tokenRecord.save();

  return publicUser(user);
}

export async function resendVerification(email) {
  const user = await userModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    return;
  }

  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified");
  }

  await sendVerificationEmail(user);
}

export async function loginUser({ email, password, req }) {
  const user = await userModel.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Email or password is invalid");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account is inactive");
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = await createSession(user, req);

  return {
    ...tokens,
    user: publicUser(user),
  };
}

export async function refreshSession(refreshToken, req) {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const payload = verifyJwt(refreshToken);
  if (payload.type !== "refresh" || !payload.sid) {
    throw new ApiError(401, "Refresh token is invalid");
  }

  const session = await SessionModel.findOne({
    _id: payload.sid,
    user: payload.sub,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw new ApiError(401, "Refresh token is invalid or expired");
  }

  const user = await userModel.findById(payload.sub);
  if (!user || !user.isActive) {
    await SessionModel.deleteOne({ _id: payload.sid });
    throw new ApiError(401, "Authentication failed");
  }

  await SessionModel.deleteOne({ _id: payload.sid });
  const tokens = await createSession(user, req);

  return {
    ...tokens,
    user: publicUser(user),
  };
}

export async function logoutCurrentSession(refreshToken) {
  if (!refreshToken) return;

  try {
    const payload = verifyJwt(refreshToken);
    if (payload.sid) {
      await SessionModel.deleteOne({ _id: payload.sid });
    }
  } catch {
    await SessionModel.deleteOne({ refreshTokenHash: hashToken(refreshToken) });
  }
}

export async function logoutAllSessions(userId) {
  await SessionModel.deleteMany({ user: userId });
}

export async function forgotPassword(email) {
  const user = await userModel.findOne({ email: email.toLowerCase() });

  if (user) {
    await sendPasswordResetEmail(user);
  }
}

export async function resetPassword({ token, password }) {
  const tokenRecord = await PasswordResetTokenModel.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenRecord) {
    throw new ApiError(400, "Password reset token is invalid or expired");
  }

  const user = await userModel.findById(tokenRecord.user).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.password = password;
  if (user.provider === "google") {
    user.provider = "local_google";
  }
  await user.save();

  tokenRecord.usedAt = new Date();
  await tokenRecord.save();
  await SessionModel.deleteMany({ user: user._id });
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await userModel.findById(userId).select("+password");

  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is invalid");
  }

  user.password = newPassword;
  await user.save();
  await SessionModel.deleteMany({ user: user._id });
}

export async function googleLogin({ idToken, req }) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) {
    throw new ApiError(401, "Google account email is not verified");
  }

  let user = await userModel
    .findOne({ email: payload.email.toLowerCase() })
    .select("+password");

  if (user) {
    if (user.googleId && user.googleId !== payload.sub) {
      throw new ApiError(409, "This email is already linked to another Google account");
    }

    user.googleId = user.googleId || payload.sub;
    user.avatar = user.avatar || payload.picture;
    user.isEmailVerified = true;
    user.isActive = true;
    user.provider = user.password ? "local_google" : "google";
  } else {
    user = await userModel.create({
      username: await ensureUniqueUsername(payload.email.split("@")[0]),
      fullname: payload.name || payload.email.split("@")[0],
      email: payload.email,
      googleId: payload.sub,
      avatar: payload.picture,
      isEmailVerified: true,
      isActive: true,
      provider: "google",
    });
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = await createSession(user, req);

  return {
    ...tokens,
    user: publicUser(user),
  };
}

export function toPublicUser(user) {
  return publicUser(user);
}
