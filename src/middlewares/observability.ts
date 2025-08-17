import { Request, Response, NextFunction } from 'express';
import { logger, logPerformance, addRequestContext } from '@/utils/logger';

interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

export const observabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  req.startTime = startTime;
  const requestId = req.headers['x-request-id'] as string || Math.random().toString(36).substr(2, 9);
  
  res.setHeader('x-request-id', requestId);
  
  req.logger = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.id
  });

  req.logger.info('Request started', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? '[REDACTED]' : undefined
    }
  });

  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  res.send = function(body: any) {
    logRequestMetrics(req, res, startTime);
    return originalSend.call(this, body);
  };

  res.json = function(body: any) {
    logRequestMetrics(req, res, startTime);
    return originalJson.call(this, body);
  };

  res.end = function(chunk?: any, encoding?: any) {
    logRequestMetrics(req, res, startTime);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

function logRequestMetrics(req: Request, res: Response, startTime: number) {
  const duration = Date.now() - startTime;
  const metrics: RequestMetrics = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.id
  };

  logPerformance('http_request', duration, {
    method: metrics.method,
    url: metrics.url,
    statusCode: metrics.statusCode,
    requestId: req.headers['x-request-id']
  });

  if (metrics.statusCode >= 400) {
    req.logger?.warn('Request failed', metrics);
  } else {
    req.logger?.info('Request completed', metrics);
  }
}

export const errorObservabilityMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const duration = Date.now() - (req as any).startTime;
  
  req.logger?.error('Unhandled error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.url,
      duration,
      requestId: req.headers['x-request-id']
    }
  });

  next(error);
};

export const databaseObservabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalQuery = (req as any).prisma?.$queryRaw;
  
  if (originalQuery) {
    (req as any).prisma.$queryRaw = async (...args: any[]) => {
      const startTime = Date.now();
      try {
        const result = await originalQuery.apply((req as any).prisma, args);
        const duration = Date.now() - startTime;
        
        logPerformance('database_query', duration, {
          query: args[0]?.toString().substring(0, 100) + '...',
          requestId: req.headers['x-request-id']
        });
        
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        req.logger?.error('Database query failed', {
          error: error.message,
          duration,
          query: args[0]?.toString().substring(0, 100) + '...',
          requestId: req.headers['x-request-id']
        });
        throw error;
      }
    };
  }
  
  next();
};

export const cacheObservabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalGet = (req as any).redis?.get;
  const originalSet = (req as any).redis?.set;
  
  if (originalGet) {
    (req as any).redis.get = async (key: string) => {
      const startTime = Date.now();
      try {
        const result = await originalGet.call((req as any).redis, key);
        const duration = Date.now() - startTime;
        
        logPerformance('cache_get', duration, {
          key: key.substring(0, 50),
          hit: result !== null,
          requestId: req.headers['x-request-id']
        });
        
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        req.logger?.error('Cache get failed', {
          error: error.message,
          duration,
          key: key.substring(0, 50),
          requestId: req.headers['x-request-id']
        });
        throw error;
      }
    };
  }
  
  if (originalSet) {
    (req as any).redis.set = async (key: string, value: any, ...args: any[]) => {
      const startTime = Date.now();
      try {
        const result = await originalSet.call((req as any).redis, key, value, ...args);
        const duration = Date.now() - startTime;
        
        logPerformance('cache_set', duration, {
          key: key.substring(0, 50),
          requestId: req.headers['x-request-id']
        });
        
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        req.logger?.error('Cache set failed', {
          error: error.message,
          duration,
          key: key.substring(0, 50),
          requestId: req.headers['x-request-id']
        });
        throw error;
      }
    };
  }
  
  next();
};

  
export const generateHealthReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV,
    railway: {
      environment: process.env.RAILWAY_ENVIRONMENT,
      projectId: process.env.RAILWAY_PROJECT_ID,
      serviceId: process.env.RAILWAY_SERVICE_ID
    }
  };

  logger.info('Health report generated', report);
  return report;
};
