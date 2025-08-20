# Módulo Search

## Visão Geral

O módulo **Search** é responsável pela funcionalidade de busca avançada de mangás e categorias no sistema S2Mangas. Este módulo oferece capacidades robustas de pesquisa com múltiplos filtros, suporte a múltiplos idiomas e busca textual inteligente.

## Estrutura do Diretório

```
src/modules/search/
├── controllers/
│   └── SearchController.ts        # Controladores HTTP para busca
├── handlers/
│   └── SearchHandler.ts           # Lógica de negócio para busca
├── routes/
│   └── SearchRouter.ts            # Definição das rotas
├── validators/
│   └── SearchValidator.ts         # Schemas de validação Zod
└── constants/
    └── search.ts                  # Constantes de busca
```

## Funcionalidades Principais

### 1. Busca de Mangás
- **Busca básica** por nome com filtros simples
- **Busca avançada** com múltiplos critérios
- **Busca textual inteligente** em nome e descrição
- **Filtros por categoria, status e tipo**
- **Suporte a múltiplos idiomas**
- **Paginação eficiente**
- **Ordenação por relevância**

### 2. Busca de Categorias
- **Listagem de todas as categorias**
- **Busca por nome de categoria**
- **Paginação de resultados**
- **Suporte a idiomas**

### 3. Utilitários de Busca
- **Listagem de tipos de mangá** (Manga, Manhwa, Manhua, Webtoon)
- **Listagem de idiomas disponíveis**
- **Constantes de busca** centralizadas

## Endpoints da API

### Busca de Mangás
- `POST /search/` - Busca básica de mangás
- `GET /search/advanced` - Busca avançada com query parameters

### Busca de Categorias
- `GET /search/categories` - Listar todas as categorias
- `POST /search/categories/search` - Buscar categorias por nome

### Utilitários
- `GET /search/types` - Listar tipos de mangá
- `GET /search/languages` - Listar idiomas disponíveis

## Parâmetros de Busca

### Busca Básica
```typescript
interface SearchRequest {
  name?: string;           // Nome do mangá
  category?: string;       // Categoria
  status?: string;         // Status (Em andamento, Completo, etc.)
  type?: string;          // Tipo (Manga, Manhwa, etc.)
  page?: number;          // Página (padrão: 1)
  limit?: number;         // Itens por página (padrão: 10)
}
```

### Busca Avançada
```typescript
interface AdvancedSearchRequest {
  name?: string;           // Nome do mangá
  categories?: string[];   // Lista de categorias
  status?: string;         // Status do mangá
  type?: string;          // Tipo do mangá
  languages?: string[];    // Lista de idiomas
  orderBy?: string;       // Critério de ordenação
  page?: string;          // Página
  limit?: string;         // Limite por página
}
```

## Schemas de Dados

### Manga (Resultado de Busca)
```typescript
interface Manga {
  id: string;              // UUID único
  name: string;            // Nome traduzido
  description?: string;    // Descrição traduzida
  cover?: string;          // URL da capa
  status: string;          // Status atual
  type: string;           // Tipo do mangá
  createdAt: Date;        // Data de criação
  updatedAt: Date;        // Última atualização
  translations: Translation[]; // Traduções disponíveis
  categories: Category[];  // Categorias associadas
  _count: {
    views: number;         // Total de visualizações
    likes: number;         // Total de curtidas
    chapters: number;      // Total de capítulos
  };
}
```

### Resposta de Busca
```typescript
interface SearchResponse {
  mangas: Manga[];         // Lista de mangás encontrados
  total: number;           // Total de resultados
  totalPages: number;      // Total de páginas
  currentPage: number;     // Página atual
  limit: number;          // Itens por página
}
```

## Validação de Dados

### Schema de Busca Avançada
```typescript
const advancedSearchSchema = z.object({
  name: z.string().optional(),
  categories: z.array(z.string()).optional(),
  status: z.enum([...MANGA_STATUS]).optional(),
  type: z.enum([...MANGA_TYPE]).optional(),
  languages: z.array(z.string()).optional(),
  orderBy: z.enum([...MANGA_ORDER]).default('most_recent'),
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).default('10'),
});
```

### Constantes de Validação
```typescript
const MANGA_STATUS = {
  ONGOING: 'Em andamento',
  COMPLETED: 'Completo',
  DROPPED: 'Descontinuado',
  HIATUS: 'Em hiato',
  ANNOUNCED: 'Anunciado'
};

const MANGA_TYPE = {
  MANGA: 'Manga',
  MANHWA: 'Manhwa',
  MANHUA: 'Manhua',
  WEBTOON: 'Webtoon'
};

const MANGA_ORDER = {
  MOST_VIEWED: 'most_viewed',
  MOST_LIKED: 'most_liked',
  MOST_RECENT: 'most_recent'
};
```

## Sistema de Cache

### Configuração de Cache
- **Categorias**: Cache de 30 minutos (dados estáticos)
- **Idiomas**: Cache de 60 minutos (dados estáticos)
- **Tipos**: Cache de 60 minutos (dados estáticos)
- **Resultados de busca**: Sem cache (dados dinâmicos)

### Estratégias de Cache
```typescript
// Cache para dados estáticos
SearchRouter.get('/categories', cacheMiddleware(cacheTTL.categories), listCategories);
SearchRouter.get('/languages', cacheMiddleware(cacheTTL.languages), listLanguages);
```

## Lógica de Negócio

### Algoritmo de Busca Textual
1. **Divisão de termos**: Quebra a query em palavras individuais
2. **Busca em múltiplos campos**: Nome e descrição das traduções
3. **Filtro por idioma**: Busca apenas nas traduções do idioma especificado
4. **Busca case-insensitive**: Ignora maiúsculas/minúsculas
5. **Combinação AND**: Todos os termos devem estar presentes

### Filtros Avançados
```typescript
const dbFilters: any = {};

// Busca textual
if (name) {
  const searchTerms = name.toLowerCase().split(' ').filter(term => term.length > 0);
  dbFilters.translations = {
    some: {
      AND: [
        { language: { equals: language, mode: 'insensitive' } },
        {
          OR: searchTerms.map(term => ({
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } }
            ]
          }))
        }
      ]
    }
  };
}

// Filtro por categoria
if (category) {
  dbFilters.categories = {
    some: {
      name: { equals: category, mode: 'insensitive' }
    }
  };
}
```

### Paginação e Ordenação
```typescript
const pageNumber = Math.max(1, page);
const limitNumber = Math.max(1, Math.min(MAX_LIMIT, limit));
const skip = (pageNumber - 1) * limitNumber;

const mangas = await prisma.manga.findMany({
  where: dbFilters,
  skip,
  take: limitNumber,
  orderBy: { createdAt: 'desc' },
  include: {
    translations: { where: { language } },
    categories: true,
    _count: {
      select: {
        views: true,
        likes: true,
        chapters: true
      }
    }
  }
});
```

## Tratamento de Erros

### Validação de Entrada
- **Schemas Zod**: Validação automática de tipos e formatos
- **Sanitização**: Limpeza de inputs maliciosos
- **Limites**: Controle de paginação e tamanho de resultados

### Códigos de Status HTTP
- `200`: Busca realizada com sucesso
- `400`: Parâmetros inválidos
- `401`: Não autorizado (rotas protegidas)
- `500`: Erro interno do servidor

## Dependências

### Internas
- **Auth Module**: Middleware `requireAuth`
- **Manga Module**: Modelos e relacionamentos
- **Categories Module**: Dados de categorias
- **Cache Module**: Sistema de cache

### Externas
- **Prisma**: ORM para consultas ao banco
- **Zod**: Validação de schemas
- **Express**: Framework web
- **Redis**: Sistema de cache

## Segurança

### Autenticação
- **JWT Bearer Token**: Obrigatório para algumas rotas
- **Middleware requireAuth**: Validação automática

### Validação de Entrada
- **Sanitização**: Prevenção de SQL injection
- **Rate Limiting**: Proteção contra abuso
- **Input Validation**: Validação rigorosa de tipos

### Proteção de Dados
- **Campos selecionados**: Apenas dados necessários
- **Filtros de segurança**: Prevenção de vazamento de dados

## Integração com Outros Módulos

### Manga Module
- Acesso aos dados de mangás
- Relacionamentos com traduções
- Contadores de interações

### Categories Module
- Filtros por categoria
- Listagem de categorias
- Validação de categorias

### Analytics Module
- Tracking de buscas
- Métricas de popularidade
- Análise de termos

## Considerações de Performance

### Otimizações de Query
- **Índices de banco**: Otimização para busca textual
- **Includes seletivos**: Apenas dados necessários
- **Paginação eficiente**: Limit/offset otimizado
- **Filtros no banco**: Redução de dados transferidos

### Limitações
- **Limite máximo**: 50 itens por página
- **Timeout de query**: Prevenção de queries longas
- **Cache seletivo**: Apenas dados estáticos

## Próximas Melhorias

### Busca Avançada
- [ ] **Elasticsearch**: Busca full-text mais robusta
- [ ] **Fuzzy search**: Busca com tolerância a erros
- [ ] **Autocomplete**: Sugestões em tempo real
- [ ] **Filtros facetados**: Filtros dinâmicos

### Performance
- [ ] **Índices compostos**: Otimização de queries complexas
- [ ] **Cache de resultados**: Cache inteligente de buscas
- [ ] **Busca assíncrona**: Processamento em background
- [ ] **CDN para imagens**: Cache distribuído de capas

### Funcionalidades
- [ ] **Busca por tags**: Sistema de tags avançado
- [ ] **Busca semântica**: IA para busca por contexto
- [ ] **Histórico de buscas**: Salvamento de buscas do usuário
- [ ] **Buscas salvas**: Alertas para novos resultados

### Analytics
- [ ] **Métricas de busca**: Análise de termos populares
- [ ] **A/B Testing**: Testes de algoritmos
- [ ] **Relevância**: Scoring de resultados
- [ ] **Personalização**: Resultados baseados no usuário

## Testes

### Testes Unitários
- Validação de schemas
- Lógica de filtros
- Formatação de resultados

### Testes de Integração
- Endpoints da API
- Integração com banco
- Sistema de cache

### Testes de Performance
- Load testing de buscas
- Otimização de queries
- Stress testing

## Documentação Swagger

Todos os endpoints estão documentados com Swagger/OpenAPI, incluindo:
- Schemas de request/response
- Códigos de status HTTP
- Exemplos de uso
- Parâmetros obrigatórios/opcionais
- Configurações de autenticação

Acesse `/api-docs` para visualizar a documentação interativa.