# Módulo Categories

## Visão Geral

O módulo **Categories** é responsável pela gestão de categorias de mangás no sistema S2Mangas. Este módulo oferece funcionalidades completas de CRUD para categorias, permitindo organização e classificação eficiente dos mangás por gêneros, temas e características específicas.

## Estrutura do Diretório

```
src/modules/categories/
├── controllers/
│   └── CategoriesController.ts    # Controladores HTTP para categorias
├── handlers/
│   └── CategoriesHandler.ts       # Lógica de negócio para categorias
├── routes/
│   └── CategoriesRouter.ts        # Definição das rotas
├── validators/
│   └── CategoriesValidators.ts    # Schemas de validação Zod
└── __tests__/
    └── *.test.ts                  # Testes unitários
```

## Funcionalidades Principais

### 1. Gestão de Categorias
- **Criação de categorias** (apenas administradores)
- **Listagem paginada** de todas as categorias
- **Visualização detalhada** com mangás associados
- **Atualização de categorias** (apenas administradores)
- **Exclusão de categorias** (apenas administradores)
- **Contagem de mangás** por categoria

### 2. Controle de Acesso
- **Rotas públicas**: Listagem e visualização
- **Rotas administrativas**: Criação, edição e exclusão
- **Autenticação obrigatória**: Para operações administrativas
- **Autorização por role**: Verificação de privilégios de admin

### 3. Organização de Conteúdo
- **Classificação de mangás** por gêneros e temas
- **Relacionamento many-to-many** com mangás
- **Metadados de categoria** para filtros e buscas
- **Estatísticas de uso** por categoria

## Endpoints da API

### Rotas Públicas
- `GET /categories/` - Listar todas as categorias (paginado)
- `GET /categories/{id}` - Obter categoria específica com mangás

### Rotas Administrativas
- `POST /admin/categories/` - Criar nova categoria
- `PUT /admin/categories/{id}` - Atualizar categoria existente
- `DELETE /admin/categories/{id}` - Deletar categoria

## Schemas de Dados

### Category (Modelo Principal)
```typescript
interface Category {
  id: string;              // UUID único
  name: string;            // Nome da categoria
  mangas?: Manga[];        // Lista de mangás (opcional)
  _count?: {
    mangas: number;        // Contagem de mangás na categoria
  };
  createdAt?: Date;        // Data de criação
  updatedAt?: Date;        // Data da última atualização
}
```

### CategoryCreate (Criação)
```typescript
interface CategoryCreate {
  name: string;            // Nome obrigatório (1-50 caracteres)
}
```

### CategoryUpdate (Atualização)
```typescript
interface CategoryUpdate {
  name: string;            // Novo nome (1-50 caracteres)
}
```

### CategoryListResponse (Listagem)
```typescript
interface CategoryListResponse {
  data: Category[];        // Lista de categorias
  pagination: {
    total: number;         // Total de categorias
    page: number;          // Página atual
    limit: number;         // Itens por página
    totalPages: number;    // Total de páginas
    next: boolean;         // Se existe próxima página
    prev: boolean;         // Se existe página anterior
  };
}
```

## Validação de Dados

### Schema de Criação
```typescript
const createCategorySchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .trim(),
});
```

### Schema de Atualização
```typescript
const updateCategorySchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .trim(),
});
```

### Schema de Parâmetros
```typescript
const categoryParamsSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido"),
});
```

### Schema de Query
```typescript
const categoryQuerySchema = z.object({
  page: z.coerce.number()
    .min(1, "Página deve ser maior que 0")
    .default(1),
  limit: z.coerce.number()
    .min(1, "Limite deve ser maior que 0")
    .max(100, "Limite máximo é 100")
    .default(10),
});
```

### Tipos TypeScript
```typescript
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
```

## Lógica de Negócio

### Criação de Categorias
```typescript
const create = async (data: CreateCategoryData) => {
  const validatedData = createCategorySchema.parse(data);
  
  const category = await prisma.category.create({
    data: {
      name: validatedData.name,
    },
  });
  
  return category;
};
```

### Listagem com Paginação
```typescript
const list = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            mangas: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.category.count(),
  ]);
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: categories,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      next: page < totalPages,
      prev: page > 1,
    },
  };
};
```

### Busca por ID
```typescript
const getById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      mangas: {
        include: {
          translations: true,
          _count: {
            select: {
              views: true,
              likes: true,
              chapters: true,
            },
          },
        },
      },
      _count: {
        select: {
          mangas: true,
        },
      },
    },
  });
  
  if (!category) {
    throw new Error("Categoria não encontrada");
  }
  
  return category;
};
```

### Atualização de Categorias
```typescript
const update = async (id: string, data: UpdateCategoryData) => {
  const validatedData = updateCategorySchema.parse(data);
  const existing = await prisma.category.findUnique({ where: { id } });
  
  if (!existing) {
    throw new Error("Categoria não encontrada");
  }
  
  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: validatedData.name,
    },
  });
  
  return updated;
};
```

### Exclusão de Categorias
```typescript
const deleteCategory = async (id: string) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  
  if (!existing) {
    throw new Error("Categoria não encontrada");
  }
  
  await prisma.category.delete({ where: { id } });
  return { message: "Categoria deletada com sucesso" };
};
```

## Controladores HTTP

### Estrutura do Controller
```typescript
export const CategoryController = {
  create: async (req: Request, res: Response) => {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await CategoryHandler.create(validatedData);
      res.status(201).json(category);
    } catch (error) {
      handleZodError(error, res);
    }
  },
  
  list: async (req: Request, res: Response) => {
    try {
      const { page, limit } = categoryQuerySchema.parse(req.query);
      const categories = await CategoryHandler.list(page, limit);
      res.json(categories);
    } catch (error) {
      handleZodError(error, res);
    }
  },
  
  // ... outros métodos
};
```

## Configuração de Rotas

### Rotas Públicas
```typescript
const CategoriesRouter = Router();

CategoriesRouter.get("/", CategoryController.list);
CategoriesRouter.get("/:id", CategoryController.getById);
```

### Rotas Administrativas
```typescript
const AdminCategoriesRouter = Router();

AdminCategoriesRouter.post("/", requireAuth, requireAdmin, CategoryController.create);
AdminCategoriesRouter.put("/:id", requireAuth, requireAdmin, CategoryController.update);
AdminCategoriesRouter.delete("/:id", requireAuth, requireAdmin, CategoryController.delete);
```

## Tratamento de Erros

### Códigos de Status HTTP
- `200`: Operação realizada com sucesso
- `201`: Categoria criada com sucesso
- `400`: Dados inválidos ou parâmetros incorretos
- `401`: Não autorizado (token inválido)
- `403`: Acesso negado (não é administrador)
- `404`: Categoria não encontrada
- `500`: Erro interno do servidor

### Mensagens de Erro
```typescript
const errorMessages = {
  CATEGORY_NOT_FOUND: "Categoria não encontrada",
  NAME_REQUIRED: "Nome é obrigatório",
  NAME_TOO_LONG: "Nome deve ter no máximo 50 caracteres",
  INVALID_UUID: "ID deve ser um UUID válido",
  PAGE_INVALID: "Página deve ser maior que 0",
  LIMIT_INVALID: "Limite deve ser maior que 0",
  LIMIT_TOO_HIGH: "Limite máximo é 100"
};
```

### Tratamento Centralizado
```typescript
const handleCategoryError = (error: any, res: Response) => {
  if (error instanceof Error) {
    if (error.message === "Categoria não encontrada") {
      return res.status(404).json({ error: error.message });
    }
  }
  handleZodError(error, res);
};
```

## Dependências

### Internas
- **Auth Module**: Middlewares `requireAuth` e `requireAdmin`
- **Manga Module**: Relacionamento many-to-many com mangás
- **Utils**: Funções de tratamento de erros e paginação
- **Prisma**: Cliente do banco de dados

### Externas
- **Zod**: Validação de schemas e tipos
- **Express**: Framework web e tipos
- **UUID**: Validação de identificadores únicos
- **Prisma**: ORM para acesso ao banco

## Segurança

### Autenticação
- **JWT Bearer Token**: Obrigatório para rotas administrativas
- **Middleware requireAuth**: Validação automática de token
- **User Context**: Injeção de dados do usuário autenticado

### Autorização
- **Role-based Access**: Verificação de privilégios de administrador
- **Middleware requireAdmin**: Controle de acesso administrativo
- **Separação de rotas**: Públicas vs. administrativas

### Validação de Entrada
- **Sanitização**: Limpeza automática com `.trim()`
- **Validação de tipos**: Garantia de tipos corretos
- **Limites de tamanho**: Controle de comprimento do nome
- **UUID validation**: Verificação de formato de IDs

### Proteção de Dados
- **Campos selecionados**: Apenas dados necessários
- **Prevenção de SQL injection**: Via Prisma ORM
- **Rate limiting**: Proteção contra abuso (implementação futura)

## Integração com Outros Módulos

### Manga Module
- **Relacionamento many-to-many**: Mangás podem ter múltiplas categorias
- **Filtros de busca**: Categorias usadas para filtrar mangás
- **Metadados**: Informações de categoria nos mangás
- **Estatísticas**: Contagem de mangás por categoria

### Search Module
- **Filtros de busca**: Busca de mangás por categoria
- **Listagem de categorias**: Para formulários de busca
- **Autocomplete**: Sugestões de categorias
- **Faceted search**: Filtros dinâmicos

### Discover Module
- **Recomendações**: Mangás por categoria preferida
- **Filtros de descoberta**: Exploração por categoria
- **Trending categories**: Categorias em alta
- **Personalização**: Baseada em categorias favoritas

### Analytics Module
- **Métricas de categoria**: Popularidade por gênero
- **Análise de tendências**: Categorias em crescimento
- **User preferences**: Categorias preferidas dos usuários
- **Content insights**: Análise de distribuição de conteúdo

## Considerações de Performance

### Otimizações de Query
- **Índices de banco**: Otimização para nome e relacionamentos
- **Includes seletivos**: Apenas dados necessários
- **Paginação eficiente**: Limit/offset otimizado
- **Contagem paralela**: Total e dados em paralelo

### Cache Strategy
- **Cache de listagem**: Categorias mudam raramente
- **TTL longo**: Cache de 30-60 minutos
- **Invalidação por tag**: Limpeza seletiva do cache
- **Cache warming**: Pré-aquecimento de dados populares

### Limitações
- **Paginação obrigatória**: Máximo 100 itens por página
- **Limite de caracteres**: Nome limitado a 50 caracteres
- **Rate limiting**: Proteção contra criação em massa

## Próximas Melhorias

### Funcionalidades Avançadas
- [ ] **Hierarquia de categorias**: Categorias pai e filhas
- [ ] **Tags e subcategorias**: Sistema mais granular
- [ ] **Categorias personalizadas**: Criadas por usuários
- [ ] **Sinônimos**: Múltiplos nomes para mesma categoria
- [ ] **Traduções**: Nomes em múltiplos idiomas

### Metadados
- [ ] **Descrições**: Texto explicativo para categorias
- [ ] **Ícones**: Representação visual
- [ ] **Cores**: Temas visuais por categoria
- [ ] **Popularidade**: Ranking de categorias
- [ ] **Trending**: Categorias em alta

### Analytics
- [ ] **Métricas detalhadas**: Estatísticas por categoria
- [ ] **Análise temporal**: Evolução de popularidade
- [ ] **User insights**: Preferências por categoria
- [ ] **Content analysis**: Distribuição de conteúdo

### Performance
- [ ] **Elasticsearch**: Busca avançada de categorias
- [ ] **Cache distribuído**: Redis para alta disponibilidade
- [ ] **CDN**: Cache de metadados estáticos
- [ ] **Lazy loading**: Carregamento sob demanda

### UX/UI
- [ ] **Autocomplete**: Sugestões em tempo real
- [ ] **Filtros visuais**: Interface rica para seleção
- [ ] **Drag & drop**: Organização visual
- [ ] **Bulk operations**: Operações em lote

## Testes

### Testes Unitários
- **Handlers**: Lógica de negócio isolada
- **Validação**: Schemas e funções de validação
- **Autorização**: Verificação de permissões
- **Formatação**: Estrutura de dados de resposta

### Testes de Integração
- **Endpoints**: Fluxo completo da API
- **Autenticação**: Middleware de auth
- **Autorização**: Controle de acesso admin
- **Banco de dados**: Operações CRUD
- **Relacionamentos**: Integridade com mangás

### Testes de Performance
- **Load testing**: Carga de listagem
- **Stress testing**: Limites do sistema
- **Cache efficiency**: Eficiência do cache
- **Query optimization**: Otimização de consultas

### Cobertura de Testes
- **Cenários positivos**: Fluxos de sucesso
- **Cenários negativos**: Tratamento de erros
- **Edge cases**: Casos extremos
- **Segurança**: Tentativas de bypass de autorização

## Documentação Swagger

Todos os endpoints estão documentados com Swagger/OpenAPI, incluindo:
- **Schemas detalhados**: Request/response completos
- **Códigos de status**: Todos os cenários possíveis
- **Exemplos práticos**: Casos de uso reais
- **Autenticação**: Configuração de Bearer token
- **Autorização**: Requisitos de admin
- **Parâmetros**: Descrição completa de cada campo
- **Paginação**: Documentação de parâmetros de paginação

Acesse `/api-docs` para visualizar a documentação interativa.

## Considerações de Arquitetura

### Separação de Responsabilidades
- **Controllers**: Apenas validação e resposta HTTP
- **Handlers**: Lógica de negócio pura
- **Validators**: Schemas de validação isolados
- **Routes**: Configuração de rotas e middlewares

### Padrões de Design
- **Repository Pattern**: Abstração de acesso a dados
- **Service Layer**: Lógica de negócio centralizada
- **DTO Pattern**: Objetos de transferência de dados
- **Error Handling**: Tratamento centralizado de erros

### Escalabilidade
- **Modular**: Fácil extensão e manutenção
- **Testável**: Componentes isolados e testáveis
- **Reutilizável**: Código compartilhável entre módulos
- **Configurável**: Parâmetros externalizados