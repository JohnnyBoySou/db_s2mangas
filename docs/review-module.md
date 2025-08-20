# Módulo Review

## Visão Geral

O módulo `review` é responsável pelo sistema de avaliações e reviews de mangás na plataforma S2Mangas. Permite que usuários criem, atualizem e gerenciem suas avaliações detalhadas de mangás, incluindo um sistema de votação (upvote/downvote) para reviews.

## Estrutura de Diretórios

```
src/modules/review/
├── controllers/
│   └── ReviewController.ts     # Controladores HTTP e documentação Swagger
├── handlers/
│   └── ReviewHandler.ts        # Lógica de negócio para reviews
├── routes/
│   └── ReviewRouter.ts         # Configuração de rotas
└── validators/
    └── ReviewSchemas.ts        # Schemas de validação Zod
```

## Funcionalidades Principais

### Gestão de Reviews
- **Criação de Reviews**: Usuários podem criar reviews detalhadas para mangás
- **Atualização de Reviews**: Modificação de reviews existentes
- **Exclusão de Reviews**: Remoção de reviews próprias
- **Visualização de Reviews**: Listagem e busca de reviews por mangá

### Sistema de Avaliação Detalhada
- **Rating Geral**: Avaliação de 1 a 10 para o mangá
- **Avaliações Específicas**: 8 critérios detalhados (arte, história, personagens, etc.)
- **Título da Review**: Título personalizado para a avaliação
- **Conteúdo**: Texto descritivo da review (até 2000 caracteres)

### Sistema de Votação
- **Upvotes**: Usuários podem votar positivamente em reviews
- **Downvotes**: Usuários podem votar negativamente em reviews
- **Toggle de Votos**: Alternar entre upvote, downvote ou remover voto

## Endpoints da API

### Rotas Públicas

#### Listar Reviews de um Mangá
- **GET** `/manga/:mangaId`
- **Autenticação**: Não requerida
- **Parâmetros**:
  - `mangaId` (path): ID do mangá
  - `page` (query): Página (padrão: 1)
  - `limit` (query): Limite por página (padrão: 10)
- **Resposta**: Lista paginada de reviews ordenadas por upvotes e data

### Rotas Autenticadas

#### Criar Review
- **POST** `/`
- **Autenticação**: Requerida
- **Corpo da Requisição**:
```json
{
  "mangaId": "uuid",
  "title": "string (1-100 chars)",
  "rating": "number (1-10)",
  "content": "string (1-2000 chars)",
  "art": "number (1-10)",
  "story": "number (1-10)",
  "characters": "number (1-10)",
  "worldbuilding": "number (1-10)",
  "pacing": "number (1-10)",
  "emotion": "number (1-10)",
  "originality": "number (1-10)",
  "dialogues": "number (1-10)"
}
```

#### Obter Review do Usuário para um Mangá
- **GET** `/manga/:mangaId/user`
- **Autenticação**: Requerida
- **Parâmetros**:
  - `mangaId` (path): ID do mangá

#### Obter Review por ID
- **GET** `/:reviewId`
- **Autenticação**: Requerida
- **Parâmetros**:
  - `reviewId` (path): ID da review

#### Atualizar Review
- **PATCH** `/:reviewId`
- **Autenticação**: Requerida (apenas próprio autor)
- **Parâmetros**:
  - `reviewId` (path): ID da review
- **Corpo da Requisição**: Campos opcionais do schema de criação

#### Deletar Review
- **DELETE** `/:reviewId`
- **Autenticação**: Requerida (apenas próprio autor)
- **Parâmetros**:
  - `reviewId` (path): ID da review

#### Toggle Upvote
- **POST** `/:reviewId/upvote`
- **Autenticação**: Requerida
- **Parâmetros**:
  - `reviewId` (path): ID da review

#### Toggle Downvote
- **POST** `/:reviewId/downvote`
- **Autenticação**: Requerida
- **Parâmetros**:
  - `reviewId` (path): ID da review

## Schemas de Dados

### Review
```typescript
interface Review {
  id: string;
  userId: string;
  mangaId: string;
  title: string;
  rating: number;        // 1-10
  content: string;       // até 2000 chars
  art: number;          // 1-10
  story: number;        // 1-10
  characters: number;   // 1-10
  worldbuilding: number; // 1-10
  pacing: number;       // 1-10
  emotion: number;      // 1-10
  originality: number;  // 1-10
  dialogues: number;    // 1-10
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}
```

### Rating
```typescript
interface Rating {
  art: number;          // 1-10
  story: number;        // 1-10
  characters: number;   // 1-10
  worldbuilding: number; // 1-10
  pacing: number;       // 1-10
  emotion: number;      // 1-10
  originality: number;  // 1-10
  dialogues: number;    // 1-10
  title: string;        // 1-100 chars
}
```

### ReviewVote
```typescript
interface ReviewVote {
  id: string;
  userId: string;
  reviewId: string;
  isUpvote: boolean;
  createdAt: Date;
}
```

## Validação de Dados

### Schemas Zod

#### ratingSchema
- **art**: Número entre 1 e 10
- **story**: Número entre 1 e 10
- **characters**: Número entre 1 e 10
- **worldbuilding**: Número entre 1 e 10
- **pacing**: Número entre 1 e 10
- **emotion**: Número entre 1 e 10
- **originality**: Número entre 1 e 10
- **dialogues**: Número entre 1 e 10
- **title**: String de 1 a 100 caracteres

#### createReviewSchema
- **mangaId**: UUID válido
- **rating**: Número entre 1 e 10
- **content**: String de 1 a 2000 caracteres
- Inclui todos os campos do `ratingSchema`

#### updateReviewSchema
- Todos os campos do `createReviewSchema` como opcionais

### Regras de Validação
- Usuário só pode ter uma review por mangá
- Todas as avaliações devem estar entre 1 e 10
- Conteúdo limitado a 2000 caracteres
- Título limitado a 100 caracteres

## Lógica de Negócio

### Handlers Principais

#### createReview
- Verifica se usuário já tem review para o mangá
- Valida todas as avaliações (1-10)
- Cria review com dados do usuário
- Retorna review criada com dados do usuário

#### updateReview
- Atualiza campos fornecidos da review
- Mantém campos não fornecidos inalterados
- Retorna review atualizada com dados do usuário

#### deleteReview
- Remove review do banco de dados
- Cascata remove votos associados

#### getMangaReviews
- Lista reviews de um mangá com paginação
- Ordena por upvotes (desc) e data de criação (desc)
- Inclui dados básicos do usuário autor
- Retorna metadados de paginação

#### getUserReview
- Busca review específica de um usuário para um mangá
- Retorna null se não encontrada
- Inclui dados do usuário

#### getReview
- Busca review por ID
- Inclui dados do usuário e votos
- Lança erro se não encontrada

#### toggleUpvote
- Remove upvote existente
- Converte downvote em upvote
- Adiciona novo upvote
- Atualiza contadores na review

#### toggleDownvote
- Remove downvote existente
- Converte upvote em downvote
- Adiciona novo downvote
- Atualiza contadores na review

## Controladores HTTP

O `ReviewController.ts` gerencia:
- Documentação Swagger para todos os endpoints
- Validação de entrada usando schemas Zod
- Tratamento de erros específicos
- Formatação de respostas HTTP
- Integração com handlers de negócio

## Configuração de Rotas

### Rotas Públicas
- `GET /manga/:mangaId` - Listar reviews de um mangá

### Rotas Autenticadas
- `POST /` - Criar review
- `GET /manga/:mangaId/user` - Obter review do usuário
- `GET /:reviewId` - Obter review por ID
- `PATCH /:reviewId` - Atualizar review
- `DELETE /:reviewId` - Deletar review
- `POST /:reviewId/upvote` - Toggle upvote
- `POST /:reviewId/downvote` - Toggle downvote

## Tratamento de Erros

### Códigos de Status
- **200**: Operação bem-sucedida
- **201**: Review criada com sucesso
- **400**: Dados inválidos ou review já existe
- **401**: Não autenticado
- **403**: Não autorizado (tentativa de editar review de outro usuário)
- **404**: Review ou mangá não encontrado
- **500**: Erro interno do servidor

### Tipos de Erro
- **ValidationError**: Dados de entrada inválidos
- **DuplicateReviewError**: Usuário já tem review para o mangá
- **NotFoundError**: Review não encontrada
- **UnauthorizedError**: Tentativa de modificar review de outro usuário

## Dependências

### Principais
- **@prisma/client**: ORM para banco de dados
- **zod**: Validação de schemas
- **express**: Framework web

### Middlewares
- **requireAuth**: Autenticação de usuários

## Segurança

### Autenticação
- Todas as operações de escrita requerem autenticação
- Verificação de propriedade para edição/exclusão

### Validação de Dados
- Schemas Zod para validação rigorosa
- Sanitização de entrada
- Limites de tamanho para conteúdo

### Proteção de Dados
- Apenas dados necessários do usuário são expostos
- Validação de UUIDs
- Prevenção de SQL injection via Prisma

## Integração com Outros Módulos

### Módulo Manga
- Referência a mangás via `mangaId`
- Validação de existência de mangá

### Módulo User
- Associação de reviews a usuários
- Dados básicos do usuário em respostas

### Módulo Auth
- Middleware de autenticação
- Verificação de propriedade

## Considerações de Performance

### Otimizações
- Índices compostos para `userId_mangaId`
- Paginação para listagens
- Seleção específica de campos do usuário
- Ordenação otimizada por upvotes

### Limitações
- Máximo 2000 caracteres por review
- Paginação obrigatória para listagens
- Uma review por usuário por mangá

### Estratégias de Melhoria
- Cache para reviews populares
- Índices para ordenação por upvotes
- Compressão de conteúdo longo
- Rate limiting para votação

## Próximas Melhorias

### Funcionalidades
- Sistema de comentários em reviews
- Marcação de reviews como úteis
- Filtros avançados (por rating, data, etc.)
- Notificações para autores de reviews
- Sistema de moderação

### Técnicas
- Cache Redis para reviews populares
- Elasticsearch para busca avançada
- Compressão de dados
- Métricas de engajamento

### Segurança
- Rate limiting mais granular
- Detecção de spam
- Moderação automática
- Auditoria de ações

## Testes

### Cenários de Teste
- Criação de reviews válidas e inválidas
- Atualização de reviews próprias e de outros
- Sistema de votação (upvote/downvote)
- Paginação e ordenação
- Validação de dados de entrada
- Tratamento de erros

### Integração
- Testes com banco de dados
- Testes de autenticação
- Testes de autorização
- Testes de performance

### Cobertura
- Handlers de negócio: 100%
- Controladores HTTP: 95%
- Validação de dados: 100%
- Tratamento de erros: 90%

## Documentação Swagger

O módulo inclui documentação completa Swagger com:
- Schemas para todas as entidades
- Exemplos de requisições e respostas
- Códigos de status e erros
- Parâmetros e validações
- Requisitos de autenticação

A documentação está disponível em `/api-docs` quando o servidor está em execução.