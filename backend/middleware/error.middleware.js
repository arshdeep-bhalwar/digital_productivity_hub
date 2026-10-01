export function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);

  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
  const message = statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : (err.message || 'An error occurred processing your request.');

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
}
