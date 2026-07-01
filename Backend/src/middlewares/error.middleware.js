export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(err, req, res, next) {
  const isJwtError =
    err.name === "JsonWebTokenError" || err.name === "TokenExpiredError";
  const statusCode = isJwtError ? 401 : err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 ? "Something went wrong. Please try again." : err.message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
}
