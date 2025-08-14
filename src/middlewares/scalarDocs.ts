import { Express } from 'express';

export const setupScalarDocs = async (app: Express) => {
  try {
    // Import dinâmico para evitar problemas com ES modules
    const { apiReference } = await import('@scalar/express-api-reference');
    
    // Configuração do Scalar API Reference
    app.use('/docs/scalar', apiReference({
      spec: {
        url: '/api-docs.json',
      },
    }));
  } catch (error) {
    console.warn('⚠️ Scalar docs não puderam ser configurados:', error);
  }
}; 