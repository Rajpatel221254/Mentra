import { searchResources } from "../services/resource.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const searchResourcesController = asyncHandler(async (req, res) => {
  const result = await searchResources(
    req.user._id,
    req.params.subjectId,
    req.query,
  );

  res.status(200).json({
    success: true,
    resources: result.items,
    pagination: result.pagination,
  });
});
