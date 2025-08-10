import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'S2Mangas API',
      version: '1.0.2',
      description: 'API para gerenciamento de mangás, biblioteca pessoal e sistema de recomendações',
      contact: {
        name: 'S2Mangas Team',
        email: 'contato@s2mangas.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.s2mangas.com',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            status: {
              type: 'number',
              description: 'Código de status HTTP'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário'
            },
            name: {
              type: 'string',
              description: 'Nome do usuário'
            },
            avatar: {
              type: 'string',
              description: 'URL do avatar do usuário'
            },
            coins: {
              type: 'number',
              description: 'Quantidade de moedas do usuário'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação da conta'
            }
          }
        },
        Manga: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do mangá'
            },
            title: {
              type: 'string',
              description: 'Título do mangá'
            },
            description: {
              type: 'string',
              description: 'Descrição do mangá'
            },
            cover: {
              type: 'string',
              description: 'URL da capa do mangá'
            },
            status: {
              type: 'string',
              enum: ['ongoing', 'completed', 'hiatus', 'cancelled'],
              description: 'Status do mangá'
            },
            rating: {
              type: 'number',
              description: 'Avaliação média do mangá'
            },
            chapters: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Chapter'
              }
            }
          }
        },
        Chapter: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do capítulo'
            },
            number: {
              type: 'number',
              description: 'Número do capítulo'
            },
            title: {
              type: 'string',
              description: 'Título do capítulo'
            },
            pages: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'URLs das páginas do capítulo'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/modules/**/routes/*.ts',
    './src/modules/**/controllers/*.ts',
    './src/server.ts'
  ]
};

export const specs = swaggerJsdoc(options); 