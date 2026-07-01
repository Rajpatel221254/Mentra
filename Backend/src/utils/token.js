import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    config.JWT_SECRET,
    { expiresIn: config.ACCESS_TOKEN_EXPIRES_IN },
  );
}

export function signRefreshToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      sid: sessionId.toString(),
      type: "refresh",
    },
    config.JWT_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN },
  );
}

export function verifyJwt(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
