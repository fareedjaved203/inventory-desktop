// Middleware to handle database connection cleanup

export function connectionCleanup(prisma) {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to ensure cleanup
    res.end = function(...args) {
      // Force connection cleanup
      setImmediate(async () => {
        try {
          // Disconnect any hanging connections
          await prisma.$disconnect();
          await prisma.$connect();
        } catch (error) {
          console.error('Connection cleanup error:', error.message);
        }
      });
      
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`Slow query: ${req.method} ${req.path} took ${duration}ms`);
      }
      
      // Call original end
      originalEnd.apply(this, args);
    };

    // Handle errors and ensure cleanup
    res.on('error', async (error) => {
      console.error('Response error:', error);
      try {
        await prisma.$disconnect();
      } catch (cleanupError) {
        console.error('Error cleanup failed:', cleanupError.message);
      }
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