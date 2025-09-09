// Middleware to handle database connection cleanup

export function connectionCleanup(prisma) {
  return async (req, res, next) => {
    // Add cleanup on response finish
    res.on('finish', () => {
      // Prisma handles connection pooling automatically
      // This is just for logging and monitoring
      console.debug(`Request ${req.method} ${req.path} completed`);
    });

    // Handle errors and ensure cleanup
    res.on('error', (error) => {
      console.error('Response error:', error);
    });

    next();
  };
}

// Request timeout middleware to prevent hanging connections
export function requestTimeout(timeoutMs = 30000) {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('error', () => {
      clearTimeout(timeout);
    });

    next();
  };
}