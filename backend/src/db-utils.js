// Database utility functions to prevent connection leaks

export async function withTransaction(prisma, callback) {
  try {
    return await prisma.$transaction(callback, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    });
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

export async function safeQuery(prisma, queryFn) {
  try {
    return await queryFn(prisma);
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  } finally {
    // Ensure connection is released back to pool
    // Prisma handles this automatically, but we can add logging
    console.debug('Query completed, connection returned to pool');
  }
}

export function createConnectionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: isProduction ? ['error'] : ['warn', 'error'],
    errorFormat: 'pretty',
    // Connection pool settings
    __internal: {
      engine: {
        connectionTimeout: 20000,
        maxIdleTime: 30000
      }
    }
  };
}