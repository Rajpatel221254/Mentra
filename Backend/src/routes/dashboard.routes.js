import express from "express";
import { getDashboardController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/", authenticate, getDashboardController);

export default dashboardRouter;