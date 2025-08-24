import * as Sentry from '@sentry/node';
import { logger } from '@/utils/logger';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENABLED =
  !!SENTRY_DSN && (process.env.SENTRY_ENABLED ?? 'true') !== 'false';

export function initSentry() {
  if (!SENTRY_ENABLED) {
    logger?.warn?.('Sentry disabled (no DSN or SENTRY_ENABLED=false)');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',
      serverName: process.env.RAILWAY_SERVICE_ID || 'local',

      // Tracing
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),

      // Debug só em dev
      debug: process.env.NODE_ENV === 'development',

      // Sanitização e filtro
      beforeSend(event, hint) {
        const error = hint?.originalException as any;

        // Ignorar 400/404
        if (error && typeof error === 'object' && 'status' in error) {
          if (error.status === 400 || error.status === 404) return null;
        }

        // Remover dados sensíveis de headers e request
        if (event.request?.headers) {
          const h = event.request.headers;
          delete h.authorization;
          delete h.cookie;
        }
        if (event.user) {
          delete (event.user as any).ip_address;
        }

        return event;
      },

      // Tags estáticas
      initialScope: {
        tags: {
          service: 's2mangas-api',
          railway_environment: process.env.RAILWAY_ENVIRONMENT,
          railway_project_id: process.env.RAILWAY_PROJECT_ID,
        },
      },

      // Integrações
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
    });

    // Captura global
    process.on('unhandledRejection', (reason: any) => {
      Sentry.captureException(reason);
    });
    process.on('uncaughtException', (err) => {
      Sentry.captureException(err);
      // opcional: process.exit(1);
    });
  } catch (error) {
    logger?.error?.('Failed to initialize Sentry', { error });
  }
}

// APIs utilitárias (sem mudanças relevantes)
export function captureException(error: Error, context?: Record<string, any>) {
  if (!SENTRY_ENABLED) return;
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
    level: 'error',
  });
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  if (!SENTRY_ENABLED) return;
  Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
  });
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  if (!SENTRY_ENABLED) return;
  Sentry.addBreadcrumb(breadcrumb);
}
export function setUser(user: { id?: string; email?: string; username?: string }) {
  if (!SENTRY_ENABLED) return;
  Sentry.setUser(user);
}
export function setTag(key: string, value: string) {
  if (!SENTRY_ENABLED) return;
  Sentry.setTag(key, value);
}
export function setContext(name: string, context: Record<string, any>) {
  if (!SENTRY_ENABLED) return;
  Sentry.setContext(name, context);
}

// Express
export function setupSentryMiddleware(_app: any) {
  if (!SENTRY_ENABLED) return;

  // v8: o expressIntegration cobre request scope; essa chamada mantém compat com stack de middlewares do SDK
  // Se preferir, apenas deixe o errorHandler. Aqui garantimos ordem.
  // (Se usar v7, troque por Handlers.requestHandler()/tracingHandler())
}

export function sentryErrorHandler() {
  if (!SENTRY_ENABLED) {
    return (err: any, _req: any, _res: any, next: any) => next(err);
  }
  return Sentry.expressErrorHandler();
}
