import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import { logger } from '@/utils/logger';

export const mangaDexProxy = createProxyMiddleware({
    target: 'https://api.mangadx.org',
    changeOrigin: true,
    pathRewrite: {
        '^/api/mangadx': '',
    },
    on: {
        proxyRes: function(proxyRes: any, _req: Request, _res: Response) {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        },
        error: function(err: Error, req: Request, res: Response | any) {
            logger.error('Erro no proxy:', err);
            if (res && typeof res.status === 'function') {
                res.status(500).json({ error: 'Erro no proxy' });
            }
        }
    }
});