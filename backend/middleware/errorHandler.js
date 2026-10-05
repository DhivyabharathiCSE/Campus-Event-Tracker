const { error } = require('../utils/response');

// 404 handler for unmatched routes
function notFound(req, res) {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

// Catch-all error handler. Express recognizes this by its 4 arguments.
function globalErrorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, 'A record with this value already exists.', 409, err.message);
  }

  return error(res, 'Something went wrong on the server.', 500, err.message);
}

module.exports = { notFound, globalErrorHandler };
