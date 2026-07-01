import { config } from "../config/config.js";

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.COOKIE_SAME_SITE.toLowerCase(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
}

export function setRefreshCookie(res, refreshToken) {
  res.cookie(
    config.REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    getRefreshCookieOptions(),
  );
}

export function clearRefreshCookie(res) {
  res.clearCookie(config.REFRESH_TOKEN_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
}
