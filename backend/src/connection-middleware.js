// Middleware to handle database connection cleanup

export function connectionCleanup(prisma) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function for monitoring only
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      if (duration > 10000) {
        console.warn(`Slow query: ${req.method} ${req.path} took ${duration}ms`);
      }
      
      // Call original end
      originalEnd.apply(this, args);
    };

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