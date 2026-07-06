import { getDashboardSummary } from "../services/dashboard.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getDashboardController = asyncHandler(async (req, res) => {
  const dashboard = await getDashboardSummary(req.user);

  res.status(200).json({
    success: true,
    dashboard,
  });
});
