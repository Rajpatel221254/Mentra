import dotenv from 'dotenv'

dotenv.config()

if(!process.env.PORT){
    throw new error("PORT is not defined in .env")
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new error("GOOGLE_CLIENT_ID is not defined in .env");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new error("GOOGLE_CLIENT_SECRET is not defined in .env");
}

if (!process.env.GOOGLE_REFRESH_TOKEN) {
  throw new error("GOOGLE_REFRESH_TOKEN is not defined in .env");
}

if (!process.env.GOOGLE_USER) {
  throw new error("GOOGLE_USER is not defined in .env");
}

if (!process.env.JWT_SECRET) {
  throw new error("JWT_SECRET is not defined in .env");
}

export const config = {
  PORT: process.env.PORT,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  GOOGLE_USER: process.env.GOOGLE_USER,
  JWT_SECRET: process.env.JWT_SECRET,
};