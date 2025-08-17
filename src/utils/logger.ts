import winston from 'winston';

// Configurações específicas para Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;
const isProduction = process.env.NODE_ENV === 'production';

// Formato estruturado para observabilidade
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      service: 's2mangas-api',
      environment: process.env.NODE_ENV || 'development',
      railway: {
        environment: process.env.RAILWAY_ENVIRONMENT,
        projectId: process.env.RAILWAY_PROJECT_ID,
        serviceId: process.env.RAILWAY_SERVICE_ID
      },
      ...meta
    };
    
    return JSON.stringify(logEntry);
  })
);

// Formato para desenvolvimento local
const developmentFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Configuração dos transports
const transports: winston.transport[] = [];

// Console transport (sempre ativo)
transports.push(
  new winston.transports.Console({
    format: isProduction ? structuredFormat : developmentFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
);

// File transports (apenas em desenvolvimento ou se especificado)
if (!isRailway && !isProduction) {
  transports.push(
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: structuredFormat
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: structuredFormat
    })
  );
}

// Railway-specific: Log para stdout (capturado pelo Railway)
if (isRailway) {
  // Railway captura automaticamente stdout/stderr
  // Não precisamos de arquivos de log
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  transports,
  // Não sair em caso de erro
  exitOnError: false
});

// Middleware para adicionar contexto às requisições
export const addRequestContext = (req: any, res: any, next: any) => {
  req.logger = logger.child({
    requestId: req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9),
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id
  });
  next();
};

// Função para logs de performance
export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  logger.info('Performance metric', {
    operation,
    duration,
    unit: 'ms',
    ...metadata
  });
};

// Função para logs de erro estruturados
export const logError = (error: Error, context?: any) => {
  logger.error('Application error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  });
};

// Função para logs de métricas de negócio
export const logMetric = (metric: string, value: number, tags?: Record<string, string>) => {
  logger.info('Business metric', {
    metric,
    value,
    tags,
    timestamp: new Date().toISOString()
  });
};

// Health check logger
export const logHealthCheck = (status: 'healthy' | 'unhealthy', details?: any) => {
  logger.info('Health check', {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ...details
  });
}; 