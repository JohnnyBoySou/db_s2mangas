# Módulo Comments

## Visão Geral

O módulo **Comments** é responsável pelo sistema de comentários no S2Mangas, permitindo que usuários interajam e compartilhem opiniões sobre mangás específicos. Este módulo oferece funcionalidades completas de CRUD para comentários, incluindo sistema de respostas hierárquicas e controle de permissões.

## Estrutura do Diretório

```
src/modules/comment/
├── controllers/
│   └── CommentController.ts       # Controladores HTTP para comentários
├── handlers/
│   └── CommentHandler.ts          # Lógica de negócio para comentários
├── routes/
│   └── CommentRouter.ts           # Definição das rotas
├── validators/
│   └── CommentValidator.ts        # Schemas de validação Zod
└── __tests__/
    └── handler.test.ts            # Testes unitários
```

## Funcionalidades Principais

### 1. Gestão de Comentários
- **Criação de comentários** em mangás específicos
- **Listagem paginada** de comentários por mangá
- **Atualização de comentários** (apenas pelo autor)
- **Exclusão de comentários** (apenas pelo autor)
- **Sistema de respostas** hierárquicas (comentários aninhados)
- **Informações do autor** incluídas automaticamente

### 2. Controle de Permissões
- **Autenticação obrigatória** para todas as operações
- **Autorização por propriedade** (apenas o autor pode editar/deletar)
- **Validação de dados** rigorosa
- **Proteção contra spam** e conteúdo malicioso

### 3. Sistema de Respostas
- **Comentários pai e filhos** com relacionamento hierárquico
- **Referência ao comentário original** via `parentId`
- **Estrutura aninhada** para threads de discussão
- **Navegação intuitiva** entre comentários relacionados

## Endpoints da API

### Comentários
- `POST /comments/` - Criar novo comentário
- `GET /comments/{mangaId}` - Listar comentários de um mangá
- `PUT /comments/{id}` - Atualizar comentário existente
- `DELETE /comments/{id}` - Deletar comentário

## Schemas de Dados

### Comment (Modelo Principal)
```typescript
interface Comment {
  id: string;              // UUID único
  message: string;         // Conteúdo do comentário
  userId: string;          // ID do usuário autor
  mangaId: string;         // ID do mangá comentado
  parentId?: string;       // ID do comentário pai (para respostas)
  createdAt: Date;         // Data de criação
  updatedAt: Date;         // Data da última atualização
  user: {
    id: string;
    name: string;
    avatar?: string;
    username: string;
  };
  parent?: Comment;        // Comentário pai (se for resposta)
  replies: Comment[];      // Lista de respostas
}
```

### CommentCreate (Criação)
```typescript
interface CommentCreate {
  content: string;         // Conteúdo obrigatório (min: 1 char)
  mangaId: string;         // ID do mangá obrigatório
  parentId?: string;       // ID do comentário pai (opcional)
}
```

### CommentUpdate (Atualização)
```typescript
interface CommentUpdate {
  content: string;         // Novo conteúdo (min: 1 char)
}
```

### CommentListResponse (Listagem)
```typescript
interface CommentListResponse {
  data: Comment[];         // Lista de comentários
  pagination: {
    total: number;         // Total de comentários
    page: number;          // Página atual
    limit: number;         // Itens por página
    totalPages: number;    // Total de páginas
    next: boolean;         // Se existe próxima página
    prev: boolean;         // Se existe página anterior
  };
}
```

## Validação de Dados

### Schema de Comentário
```typescript
const commentSchema = z.object({
  content: z.string().min(1, 'O comentário não pode estar vazia'),
  mangaId: z.string().min(1, 'ID do mangá é obrigatório'),
  parentId: z.string().optional().nullable(),
});
```

### Schema de ID
```typescript
const commentIdSchema = z.object({
  id: z.string().min(1, 'ID do comentário é obrigatório'),
});
```

### Funções de Validação
- **Validação automática**: Schemas Zod aplicados automaticamente
- **Sanitização**: Limpeza de inputs maliciosos
- **Verificação de tipos**: Garantia de tipos corretos
- **Mensagens de erro**: Feedback claro para o usuário

## Lógica de Negócio

### Criação de Comentários
```typescript
export const createComment = async (data: {
  userId: string;
  mangaId: string;
  content: string;
}) => {
  return await prisma.comment.create({
    data: {
      userId,
      mangaId,
      message: content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
};
```

### Listagem com Paginação
```typescript
export const listComments = async (mangaId: string, page: number, take: number) => {
  const skip = (page - 1) * take;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { mangaId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.comment.count({ where: { mangaId } }),
  ]);

  return {
    data: comments,
    pagination: {
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
      next: page < Math.ceil(total / take),
      prev: page > 1,
    },
  };
};
```

### Atualização com Autorização
```typescript
export const updateComment = async (id: string, userId: string, content: string) => {
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) {
    throw new Error('Comentário não encontrado.');
  }

  if (comment.userId !== userId) {
    throw new Error('Você não tem permissão para editar este comentário.');
  }

  return await prisma.comment.update({
    where: { id },
    data: { message: content },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
};
```

### Exclusão com Verificação
```typescript
export const deleteComment = async (id: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) {
    throw new Error('Comentário não encontrado.');
  }

  if (comment.userId !== userId) {
    throw new Error('Você não tem permissão para deletar este comentário.');
  }

  await prisma.comment.delete({ where: { id } });
};
```

## Tratamento de Erros

### Códigos de Status HTTP
- `201`: Comentário criado com sucesso
- `200`: Operação realizada com sucesso
- `204`: Comentário deletado com sucesso
- `400`: Dados inválidos ou ID do mangá obrigatório
- `401`: Não autorizado (token inválido)
- `403`: Sem permissão para editar/deletar
- `404`: Comentário não encontrado
- `500`: Erro interno do servidor

### Mensagens de Erro
```typescript
const errorMessages = {
  COMMENT_NOT_FOUND: 'Comentário não encontrado.',
  UNAUTHORIZED_EDIT: 'Você não tem permissão para editar este comentário.',
  UNAUTHORIZED_DELETE: 'Você não tem permissão para deletar este comentário.',
  INVALID_CONTENT: 'O comentário não pode estar vazia',
  MANGA_ID_REQUIRED: 'ID do mangá é obrigatório',
  COMMENT_ID_REQUIRED: 'ID do comentário é obrigatório'
};
```

### Tratamento Centralizado
```typescript
export const handleCommentError = (err: any, res: Response) => {
  if (err instanceof Error) {
    if (err.message === 'Comentário não encontrado.') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('permissão')) {
      return res.status(403).json({ error: err.message });
    }
  }
  handleZodError(err, res);
};
```

## Dependências

### Internas
- **Auth Module**: Middleware `requireAuth` e dados do usuário
- **Manga Module**: Relacionamento com mangás
- **Users Module**: Informações dos autores
- **Utils**: Funções de paginação e tratamento de erros

### Externas
- **Prisma**: ORM para acesso ao banco de dados
- **Zod**: Validação de schemas e tipos
- **Express**: Framework web e tipos de Request/Response
- **UUID**: Geração e validação de identificadores únicos

## Segurança

### Autenticação
- **JWT Bearer Token**: Obrigatório para todas as operações
- **Middleware requireAuth**: Validação automática de token
- **User Context**: Injeção automática de dados do usuário

### Autorização
- **Ownership-based**: Apenas o autor pode editar/deletar
- **Verificação de propriedade**: Validação antes de operações
- **Proteção de recursos**: Prevenção de acesso não autorizado

### Validação de Entrada
- **Sanitização**: Limpeza de inputs maliciosos
- **Validação de tipos**: Garantia de tipos corretos
- **Prevenção de XSS**: Escape de caracteres especiais
- **Rate Limiting**: Proteção contra spam

### Proteção de Dados
- **Campos selecionados**: Apenas dados necessários do usuário
- **Não exposição**: Dados sensíveis não são retornados
- **Logs de auditoria**: Tracking de operações críticas

## Integração com Outros Módulos

### Manga Module
- **Relacionamento**: Comentários vinculados a mangás específicos
- **Validação**: Verificação de existência do mangá
- **Contexto**: Comentários exibidos na página do mangá

### Users Module
- **Informações do autor**: Nome, avatar e username
- **Perfil do usuário**: Link para perfil do comentarista
- **Histórico**: Comentários do usuário

### Analytics Module
- **Métricas de engajamento**: Contagem de comentários
- **Análise de sentimento**: Processamento de conteúdo
- **Atividade do usuário**: Tracking de participação

### Notification Module (Futuro)
- **Notificações**: Alertas para respostas
- **Menções**: Sistema de @mentions
- **Moderação**: Alertas para conteúdo inadequado

## Considerações de Performance

### Otimizações de Query
- **Includes seletivos**: Apenas campos necessários do usuário
- **Paginação eficiente**: Limit/offset otimizado
- **Índices de banco**: Otimização para mangaId e userId
- **Contagem paralela**: Total e dados em paralelo

### Limitações
- **Paginação obrigatória**: Prevenção de sobrecarga
- **Limite de caracteres**: Controle de tamanho do conteúdo
- **Rate limiting**: Proteção contra spam

### Monitoramento
- **Métricas de performance**: Tempo de resposta
- **Uso de recursos**: Monitoramento de queries
- **Error rate**: Taxa de erros por endpoint

## Próximas Melhorias

### Funcionalidades Avançadas
- [ ] **Sistema de curtidas**: Upvote/downvote em comentários
- [ ] **Respostas aninhadas**: Threads de discussão mais profundas
- [ ] **Menções de usuários**: Sistema de @mentions
- [ ] **Formatação rica**: Markdown ou HTML limitado
- [ ] **Anexos**: Imagens e GIFs em comentários

### Moderação
- [ ] **Sistema de reports**: Denúncia de comentários
- [ ] **Moderação automática**: Filtros de conteúdo
- [ ] **Shadowban**: Ocultação de comentários problemáticos
- [ ] **Histórico de moderação**: Log de ações administrativas

### Performance
- [ ] **Cache de comentários**: Cache inteligente por mangá
- [ ] **Lazy loading**: Carregamento sob demanda
- [ ] **Compressão**: Otimização de payload
- [ ] **CDN**: Cache distribuído

### Analytics
- [ ] **Métricas de engajamento**: Análise de participação
- [ ] **Análise de sentimento**: Processamento de texto
- [ ] **Trending topics**: Tópicos em alta
- [ ] **User insights**: Perfil de comentaristas

### UX/UI
- [ ] **Comentários em tempo real**: WebSockets
- [ ] **Editor rico**: Interface de edição avançada
- [ ] **Prévia**: Visualização antes de publicar
- [ ] **Histórico de edições**: Controle de versões

## Testes

### Testes Unitários
- **Handlers**: Lógica de negócio isolada
- **Validação**: Schemas e funções de validação
- **Autorização**: Verificação de permissões
- **Formatação**: Estrutura de dados de resposta

### Testes de Integração
- **Endpoints**: Fluxo completo da API
- **Autenticação**: Middleware de auth
- **Banco de dados**: Operações CRUD
- **Relacionamentos**: Integridade referencial

### Testes de Performance
- **Load testing**: Carga de comentários
- **Stress testing**: Limites do sistema
- **Memory leaks**: Vazamentos de memória
- **Query optimization**: Otimização de consultas

### Cobertura de Testes
- **Cenários positivos**: Fluxos de sucesso
- **Cenários negativos**: Tratamento de erros
- **Edge cases**: Casos extremos
- **Segurança**: Tentativas de bypass

## Documentação Swagger

Todos os endpoints estão documentados com Swagger/OpenAPI, incluindo:
- **Schemas detalhados**: Request/response completos
- **Códigos de status**: Todos os cenários possíveis
- **Exemplos práticos**: Casos de uso reais
- **Autenticação**: Configuração de Bearer token
- **Parâmetros**: Descrição completa de cada campo

Acesse `/api-docs` para visualizar a documentação interativa.