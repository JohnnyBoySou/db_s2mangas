import * as Sentry from '@sentry/node';
import { logger } from '@/utils/logger';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    logger.warn('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',
      serverName: process.env.RAILWAY_SERVICE_ID || 'local',
      
      // Performance monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      
      // Session tracking
      autoSessionTracking: true,
      
      // Error filtering
      beforeSend(event, hint) {
        // Don't send certain errors to Sentry
        const error = hint.originalException;
        
        // Skip validation errors (400 status codes)
        if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
          return null;
        }
        
        // Skip 404 errors
        if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
          return null;
        }
        
        return event;
      },
      
      // Additional context
      initialScope: {
        tags: {
          service: 's2mangas-api',
          railway_environment: process.env.RAILWAY_ENVIRONMENT,
          railway_project_id: process.env.RAILWAY_PROJECT_ID,
        },
      },
      
      // Integrations
      integrations: [
        // Enable HTTP integration
        Sentry.httpIntegration(),
        // Enable Express integration
        Sentry.expressIntegration(),
      ],
    });

    logger.info('Sentry initialized successfully', {
      dsn: dsn.substring(0, 20) + '...', // Log partial DSN for verification
      environment: process.env.NODE_ENV,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error });
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
      level: 'error',
    });
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    });
  }
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

export function setUser(user: { id?: string; email?: string; username?: string }) {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

export function setTag(key: string, value: string) {
  if (process.env.SENTRY_DSN) {
    Sentry.setTag(key, value);
  }
}

export function setContext(name: string, context: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.setContext(name, context);
  }
}

// Export Express middleware functions
export function setupSentryMiddleware(app: any) {
  if (process.env.SENTRY_DSN) {
    // Setup Sentry error handler
    Sentry.setupExpressErrorHandler(app);
  }
}

// Export Sentry error handler
export function sentryErrorHandler() {
  if (process.env.SENTRY_DSN) {
    return Sentry.expressErrorHandler();
  }
  // Return a no-op middleware if Sentry is not configured
  return (error: any, req: any, res: any, next: any) => next(error);
}