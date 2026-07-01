import userModel from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { verifyJwt } from "../utils/token.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  const payload = verifyJwt(token);
  const user = await userModel.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, "Authentication failed");
  }

  req.user = user;
  next();
});
