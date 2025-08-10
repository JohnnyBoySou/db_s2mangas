import { Express } from 'express';
import { apiReference } from '@scalar/express-api-reference'

export const setupScalarDocs = (app: Express) => {
  // Configuração do Scalar API Reference
  app.use('/docs/scalar', apiReference({
    spec: {
      url: '/api-docs.json',
    },
  }));
}; 