# Módulo Discover

## Visão Geral

O módulo **Discover** é responsável pela descoberta e recomendação de mangás na plataforma S2Mangas. Ele oferece diferentes estratégias para apresentar conteúdo relevante aos usuários, incluindo mangás recentes, mais populares, feeds personalizados e recomendações baseadas em IA.

## Estrutura do Módulo

```
src/modules/discover/
├── controllers/
│   └── DiscoverController.ts    # Definições de rotas e schemas Swagger
├── handlers/
│   └── DiscoverHandler.ts       # Lógica de negócios
├── routes/
│   └── DiscoverRouter.ts        # Configuração de rotas
├── validators/
│   └── discoverSchemas.ts       # Schemas de validação Zod
└── types/
    └── discover.ts              # Interfaces TypeScript
```

## Funcionalidades Principais

### 1. Mangás Recentes
- **Endpoint**: `GET /discover/recents`
- **Descrição**: Retorna mangás ordenados por data de criação (mais recentes primeiro)
- **Parâmetros**: `page`, `take`, `lg` (idioma)
- **Cache**: 5 minutos com `smartCacheMiddleware`

### 2. Mangás Mais Vistos
- **Endpoint**: `GET /discover/views`
- **Descrição**: Retorna mangás ordenados por número de visualizações
- **Parâmetros**: `page`, `take`, `lg`
- **Cache**: 5 minutos com `smartCacheMiddleware`

### 3. Mangás Mais Curtidos
- **Endpoint**: `GET /discover/likes`
- **Descrição**: Retorna mangás ordenados por número de curtidas
- **Parâmetros**: `page`, `take`, `lg`
- **Cache**: 5 minutos com `smartCacheMiddleware`

### 4. Feed Personalizado
- **Endpoint**: `GET /discover/feed`
- **Descrição**: Feed personalizado baseado nas preferências do usuário
- **Parâmetros**: `page`, `take`, `lg`, `userId` (automático)
- **Cache**: 5 minutos, varia por usuário
- **Autenticação**: Obrigatória

### 5. Recomendações IA
- **Endpoint**: `GET /discover/ia`
- **Descrição**: Recomendações baseadas em algoritmos de IA
- **Parâmetros**: `page`, `take`, `lg`, `userId` (automático)
- **Cache**: 10 minutos, varia por usuário
- **Autenticação**: Obrigatória

### 6. Mangás por Categorias
- **Endpoint**: `GET /discover/categories/{categoryIds}`
- **Descrição**: Mangás filtrados por categorias específicas
- **Parâmetros**: `categoryIds` (array), `page`, `take`, `lg`
- **Cache**: 5 minutos com `smartCacheMiddleware`

### 7. Estatísticas (Admin)
- **Endpoint**: `GET /discover/stats`
- **Descrição**: Estatísticas gerais do módulo discover
- **Acesso**: Apenas administradores
- **Cache**: Não aplicado

### 8. Health Check
- **Endpoint**: `GET /discover/health`
- **Descrição**: Verificação de saúde do módulo
- **Cache**: Não aplicado

## Parâmetros Comuns

### Query Parameters
- **page**: Número da página (padrão: 1, mínimo: 1)
- **take**: Itens por página (padrão: 10, máximo: 100)
- **lg**: Idioma (padrão: 'en', suportados: pt, en, es, fr, de, ja)

### Path Parameters
- **categoryIds**: Array de UUIDs de categorias (máximo: 10)

## Schemas de Dados

### DiscoverResponse
```typescript
interface DiscoverResponse {
  data: ProcessedManga[];
  pagination: PaginationInfo;
}
```

### ProcessedManga
```typescript
interface ProcessedManga {
  id: string;
  manga_uuid: string;
  title: string;
  description: string;
  cover: string;
  views_count: number;
  likes_count: number;
  chapters_count: number;
  categories: Category[];
  createdAt: Date;
  updatedAt: Date;
}
```

### PaginationInfo
```typescript
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  next: boolean;
  prev: boolean;
}
```

### DiscoverStats
```typescript
interface DiscoverStats {
  totalMangas: number;
  totalCategories: number;
  totalViews: number;
  totalLikes: number;
  averageMangasPerCategory: number;
  language: string;
}
```

## Validação de Dados

### Schemas Zod Principais

#### Language Schema
```typescript
const languageSchema = z.string()
  .optional()
  .default('en')
  .transform((val) => {
    // Normalização de idiomas (pt-br -> pt, en-us -> en)
    const languageMap = {
      'pt-br': 'pt', 'pt-pt': 'pt',
      'en-us': 'en', 'en-gb': 'en'
    };
    return languageMap[val.toLowerCase()] || val.toLowerCase();
  })
  .refine((val) => {
    const supportedLanguages = ['pt', 'en', 'es', 'fr', 'de', 'ja'];
    return supportedLanguages.includes(val);
  });
```

#### Pagination Schema
```typescript
const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  take: z.number().int().min(1).max(100).optional().default(10),
  skip: z.number().int().min(0).optional().default(0)
});
```

#### Categories Schema
```typescript
const categoriesSchema = z.array(z.string().uuid())
  .min(1, 'Pelo menos uma categoria deve ser fornecida')
  .max(10, 'Máximo de 10 categorias permitidas');
```

### Funções de Validação
- `validateDiscoverQuery()`: Valida parâmetros de query
- `validatePagination()`: Valida parâmetros de paginação
- `validateUserId()`: Valida UUID do usuário
- `validateCategories()`: Valida array de categorias
- `extractPaginationFromQuery()`: Extrai e valida paginação
- `validateAndNormalizeLanguage()`: Normaliza idiomas

## Sistema de Cache Inteligente

### Configuração do Smart Cache
```typescript
const discoverCacheConfig = {
  ttl: 300, // 5 minutos
  tags: ['discover', 'manga'],
  varyBy: ['page', 'take', 'lg', 'userId'],
  compression: true,
  l2Cache: false
};
```

### Estratégias de Cache por Endpoint

#### Cache Padrão (5 minutos)
- `/discover/recents`
- `/discover/views`
- `/discover/likes`
- `/discover/categories/{categoryIds}`

#### Cache Personalizado
- **Feed**: 5 minutos, varia por `userId`, `page`, `take`, `lg`
- **IA**: 10 minutos, varia por `userId`

### Headers de Cache
- `X-Cache`: HIT/MISS
- `X-Cache-Key`: Chave de cache gerada
- `Cache-Control`: Configuração de cache público
- `ETag`: Hash MD5 do conteúdo

## Lógica de Negócios

### Processamento de Mangás
1. **Busca no banco**: Query otimizada com includes seletivos
2. **Tradução**: Busca tradução no idioma solicitado com fallback
3. **Formatação**: Padronização dos dados de resposta
4. **Paginação**: Cálculo de metadados de paginação
5. **Cache**: Armazenamento inteligente da resposta

### Algoritmos de Recomendação

#### Feed Personalizado
- Combina mangás mais curtidos e mais vistos
- Ordenação híbrida por popularidade
- Filtragem por idioma preferido

#### Recomendações IA
- Baseado em popularidade (implementação simplificada)
- Ordenação por curtidas e data de criação
- Potencial para ML/AI mais avançado

### Filtros e Ordenação
- **Status**: Apenas mangás ACTIVE
- **Idioma**: Filtragem por traduções disponíveis
- **Categorias**: Filtro por relacionamento many-to-many
- **Ordenação**: recent, views, likes, createdAt

## Tratamento de Erros

### Erros de Validação (400)
- Parâmetros de paginação inválidos
- Idioma não suportado
- UUIDs de categoria malformados
- Limite de categorias excedido

### Erros de Autenticação (401)
- Token JWT inválido ou expirado
- Usuário não autenticado para rotas protegidas

### Erros de Autorização (403)
- Acesso negado a rotas administrativas
- Permissões insuficientes

### Erros de Sistema (500)
- Falhas de conexão com banco de dados
- Erros no sistema de cache
- Falhas internas não tratadas

## Dependências

### Internas
- **Auth Module**: Middleware `requireAuth`
- **Manga Module**: Modelos e relacionamentos
- **Categories Module**: Filtros por categoria
- **Users Module**: Dados do usuário para personalização

### Externas
- **Prisma**: ORM para acesso ao banco
- **Zod**: Validação de schemas
- **Express**: Framework web
- **Redis**: Sistema de cache

## Segurança

### Autenticação
- **JWT Bearer Token**: Obrigatório para rotas protegidas
- **Middleware requireAuth**: Validação automática
- **User Context**: Injeção automática de dados do usuário

### Validação de Entrada
- **Sanitização**: Todos os inputs são validados
- **Rate Limiting**: Proteção contra abuso
- **SQL Injection**: Prevenção via Prisma ORM

### Autorização
- **Role-based**: Separação entre usuários e admins
- **Resource-based**: Acesso baseado em propriedade

## Integração com Outros Módulos

### Manga Module
- Acesso aos dados de mangás
- Relacionamentos com traduções
- Contadores de interações

### Categories Module
- Filtros por categoria
- Metadados de categorias

### Users Module
- Personalização de feeds
- Histórico de interações
- Preferências de idioma

### Analytics Module
- Métricas de descoberta
- Tracking de recomendações
- Análise de performance

## Considerações de Performance

### Otimizações de Query
- **Includes seletivos**: Apenas dados necessários
- **Índices de banco**: Otimização de consultas
- **Paginação eficiente**: Limit/offset otimizado

### Sistema de Cache
- **Multi-layer**: L1 (memória) + L2 (Redis)
- **Invalidação inteligente**: Por tags e TTL
- **Compressão**: Redução de uso de memória

### Monitoramento
- **Cache hit rate**: Métricas de eficiência
- **Response time**: Tempo de resposta
- **Error rate**: Taxa de erros

## Próximas Melhorias

### Algoritmos Avançados
- [ ] **Machine Learning**: Recomendações baseadas em ML
- [ ] **Collaborative Filtering**: Filtros colaborativos
- [ ] **Content-based**: Recomendações por conteúdo
- [ ] **Hybrid Approach**: Combinação de algoritmos

### Personalização
- [ ] **User Preferences**: Preferências detalhadas
- [ ] **Reading History**: Histórico de leitura
- [ ] **Behavior Tracking**: Análise comportamental
- [ ] **A/B Testing**: Testes de algoritmos

### Performance
- [ ] **GraphQL**: API mais flexível
- [ ] **Elasticsearch**: Busca avançada
- [ ] **CDN Integration**: Cache distribuído
- [ ] **Real-time Updates**: Atualizações em tempo real

### Analytics
- [ ] **Recommendation Metrics**: Métricas de recomendação
- [ ] **User Engagement**: Análise de engajamento
- [ ] **Conversion Tracking**: Tracking de conversões
- [ ] **Performance Monitoring**: Monitoramento avançado

## Testes

### Testes Unitários
- Validação de schemas
- Lógica de formatação
- Funções utilitárias

### Testes de Integração
- Endpoints da API
- Sistema de cache
- Integração com banco

### Testes de Performance
- Load testing
- Cache efficiency
- Response times

## Documentação Swagger

Todos os endpoints estão documentados com Swagger/OpenAPI, incluindo:
- Schemas de request/response
- Códigos de status HTTP
- Exemplos de uso
- Parâmetros obrigatórios/opcionais
- Configurações de autenticação

Acesse `/api-docs` para visualizar a documentação interativa.