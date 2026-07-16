import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/config.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// import Router
import authRouter from "./routes/auth.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";
import subjectRouter from "./routes/subject.routes.js";
import folderRouter from "./routes/folder.routes.js";
import noteRouter from "./routes/note.routes.js";
import fileRouter from "./routes/file.routes.js";
import resourceRouter from "./routes/resource.routes.js";
import aiRouter from "./ai/routes/ai.routes.js";

app.use("/api/auth/login", sensitiveAuthLimiter);
app.use("/api/auth/forgot-password", sensitiveAuthLimiter);
app.use("/api/auth/reset-password", sensitiveAuthLimiter);
// Router mapping
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/subjects", subjectRouter);
app.use("/api/folders", folderRouter);
app.use("/api/notes", noteRouter);
app.use("/api/files", fileRouter);
app.use("/api/resources", resourceRouter);

// AI routes — dedicated rate limiter (30 req/min) to prevent abuse
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests. Please slow down." },
});
app.use("/api/ai", aiLimiter, aiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
