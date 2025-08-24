import { Express } from 'express';

export const initScalarDocs = async (app: Express) => {
  try {
    const { apiReference } = await import('@scalar/express-api-reference');
    
    app.use('/docs/scalar', apiReference({
      spec: {
        url: '/api-docs.json',
      },
    }));
  } catch (error) {
    console.warn('⚠️ Scalar docs não puderam ser configurados:', error);
  }
}; 