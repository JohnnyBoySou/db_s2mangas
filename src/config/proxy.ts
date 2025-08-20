import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response } from 'express';

export const mangaDexProxy = createProxyMiddleware({
    target: 'https://api.mangadx.org',
    changeOrigin: true,
    pathRewrite: {
        '^/api/mangadx': '',
    },
    onProxyRes: function(proxyRes: any, req: Request, res: Response) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    },
    onError: function(err: Error, req: Request, res: Response) {
        console.error('Erro no proxy:', err);
        res.status(500).json({ error: 'Erro no proxy' });
    }
});