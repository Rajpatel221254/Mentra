import dotenv from 'dotenv'

dotenv.config()

if(!process.env.PORT){
    throw new Error("PORT is not defined in .env")
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not defined in .env");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is not defined in .env");
}

if (!process.env.GOOGLE_REFRESH_TOKEN) {
  throw new Error("GOOGLE_REFRESH_TOKEN is not defined in .env");
}

if (!process.env.GOOGLE_USER) {
  throw new Error("GOOGLE_USER is not defined in .env");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL is not defined in .env");
}

export const config = {
  PORT: process.env.PORT,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  GOOGLE_USER: process.env.GOOGLE_USER,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGO_URL: process.env.MONGO_URL,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  API_URL: process.env.API_URL || "http://localhost:3000",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  REFRESH_TOKEN_COOKIE_NAME: process.env.REFRESH_TOKEN_COOKIE_NAME || "mentra_refresh_token",
  NODE_ENV: process.env.NODE_ENV || "development",
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || "lax",
};
