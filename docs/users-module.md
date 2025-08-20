# Módulo Users

## Visão Geral

O módulo **Users** é responsável pela gestão completa de usuários no sistema S2Mangas. Este módulo oferece funcionalidades administrativas para CRUD de usuários, gestão de moedas virtuais, e controle de perfis de usuário, incluindo informações pessoais, preferências e configurações de conta.

## Estrutura do Diretório

```
src/modules/users/
├── controllers/
│   └── UsersController.ts         # Controladores HTTP para usuários
├── handlers/
│   └── UsersHandler.ts            # Lógica de negócio para usuários
├── routes/
│   └── UsersRouter.ts             # Definição das rotas
├── validators/
│   └── UsersValidator.ts          # Schemas de validação Zod
└── __tests__/
    └── *.test.ts                  # Testes unitários
```

## Funcionalidades Principais

### 1. Gestão Administrativa de Usuários
- **Listagem paginada** de todos os usuários
- **Visualização detalhada** de perfis de usuário
- **Criação de usuários** pelo administrador
- **Atualização de dados** de usuários
- **Exclusão de contas** de usuário
- **Gestão de permissões** e roles

### 2. Sistema de Moedas Virtuais
- **Adição de moedas** ao saldo do usuário
- **Remoção de moedas** com validação de saldo
- **Consulta de saldo** atual
- **Histórico de transações** (implementação futura)
- **Sistema de recompensas** (implementação futura)

### 3. Perfil de Usuário
- **Informações pessoais**: Nome, email, biografia
- **Configurações de conta**: Username, avatar, capa
- **Preferências**: Categorias favoritas, idiomas
- **Dados demográficos**: Data de nascimento
- **Metadados**: Datas de criação e atualização

### 4. Controle de Acesso
- **Autenticação obrigatória**: Para todas as operações
- **Autorização administrativa**: Apenas admins podem gerenciar usuários
- **Validação de dados**: Schemas rigorosos de validação
- **Segurança de senhas**: Hash automático de senhas

## Endpoints da API

### Rotas Administrativas
- `GET /admin/users/` - Listar todos os usuários (paginado)
- `GET /admin/users/{id}` - Obter usuário específico
- `POST /admin/users/` - Criar novo usuário
- `PUT /admin/users/{id}` - Atualizar dados do usuário
- `DELETE /admin/users/{id}` - Deletar usuário
- `POST /admin/users/{id}/coins/add` - Adicionar moedas
- `POST /admin/users/{id}/coins/remove` - Remover moedas
- `GET /admin/users/{id}/coins` - Consultar saldo

## Schemas de Dados

### User (Modelo Principal)
```typescript
interface User {
  id: string;                    // UUID único
  name: string;                  // Nome completo
  email: string;                 // Email único
  username: string;              // Username único
  avatar?: string;               // URL do avatar
  cover?: string;                // URL da capa do perfil
  bio?: string;                  // Biografia do usuário
  birthDate?: Date;              // Data de nascimento
  emailVerified: boolean;        // Status de verificação do email
  coins: number;                 // Saldo de moedas virtuais
  role: UserRole;                // Role do usuário (USER, ADMIN)
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data da última atualização
  categories?: Category[];       // Categorias favoritas
  languages?: Language[];        // Idiomas preferidos
}
```

### UserCreate (Criação)
```typescript
interface UserCreate {
  name: string;                  // Nome obrigatório (2-100 caracteres)
  email: string;                 // Email válido e único
  password: string;              // Senha (mínimo 6 caracteres)
  username?: string;             // Username opcional (gerado se não fornecido)
  avatar?: string;               // URL do avatar
  cover?: string;                // URL da capa
  bio?: string;                  // Biografia (máximo 500 caracteres)
  birthDate?: Date;              // Data de nascimento
  categories?: string[];         // IDs das categorias favoritas
  languages?: string[];          // IDs dos idiomas preferidos
}
```

### UserUpdate (Atualização)
```typescript
interface UserUpdate {
  name?: string;                 // Nome (2-100 caracteres)
  email?: string;                // Email válido
  password?: string;             // Nova senha (mínimo 6 caracteres)
  username?: string;             // Novo username
  avatar?: string;               // Nova URL do avatar
  cover?: string;                // Nova URL da capa
  bio?: string;                  // Nova biografia (máximo 500 caracteres)
  birthDate?: Date;              // Nova data de nascimento
  categories?: string[];         // Novos IDs das categorias
  languages?: string[];          // Novos IDs dos idiomas
}
```

### UserListResponse (Listagem)
```typescript
interface UserListResponse {
  data: User[];                  // Lista de usuários
  pagination: {
    total: number;               // Total de usuários
    page: number;                // Página atual
    limit: number;               // Itens por página
    totalPages: number;          // Total de páginas
    next: boolean;               // Se existe próxima página
    prev: boolean;               // Se existe página anterior
  };
}
```

### CoinsOperation (Operações de Moedas)
```typescript
interface CoinsOperation {
  amount: number;                // Quantidade de moedas (positivo)
  reason?: string;               // Motivo da operação
}

interface CoinsResponse {
  userId: string;                // ID do usuário
  previousBalance: number;       // Saldo anterior
  newBalance: number;            // Novo saldo
  operation: 'add' | 'remove';   // Tipo de operação
  amount: number;                // Quantidade operada
  timestamp: Date;               // Data/hora da operação
}
```

## Validação de Dados

### Schema de Criação
```typescript
const createUserSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  email: z.string()
    .email("Email deve ser válido")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
  username: z.string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(30, "Username deve ter no máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Username deve conter apenas letras, números e underscore")
    .optional(),
  avatar: z.string().url("Avatar deve ser uma URL válida").optional(),
  cover: z.string().url("Capa deve ser uma URL válida").optional(),
  bio: z.string()
    .max(500, "Biografia deve ter no máximo 500 caracteres")
    .optional(),
  birthDate: z.coerce.date().optional(),
  categories: z.array(z.string().uuid()).optional(),
  languages: z.array(z.string().uuid()).optional(),
});
```

### Schema de Atualização
```typescript
const updateUserSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim()
    .optional(),
  email: z.string()
    .email("Email deve ser válido")
    .toLowerCase()
    .trim()
    .optional(),
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres")
    .optional(),
  username: z.string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(30, "Username deve ter no máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Username deve conter apenas letras, números e underscore")
    .optional(),
  avatar: z.string().url("Avatar deve ser uma URL válida").optional(),
  cover: z.string().url("Capa deve ser uma URL válida").optional(),
  bio: z.string()
    .max(500, "Biografia deve ter no máximo 500 caracteres")
    .optional(),
  birthDate: z.coerce.date().optional(),
  categories: z.array(z.string().uuid()).optional(),
  languages: z.array(z.string().uuid()).optional(),
});
```

### Schema de Operações de Moedas
```typescript
const coinsOperationSchema = z.object({
  amount: z.number()
    .positive("Quantidade deve ser positiva")
    .int("Quantidade deve ser um número inteiro")
    .max(1000000, "Quantidade máxima é 1.000.000"),
  reason: z.string()
    .max(200, "Motivo deve ter no máximo 200 caracteres")
    .optional(),
});
```

### Tipos TypeScript
```typescript
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type CoinsOperationData = z.infer<typeof coinsOperationSchema>;
```

## Lógica de Negócio

### Listagem de Usuários
```typescript
const listUsers = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        emailVerified: true,
        coins: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count(),
  ]);
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: users,
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
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      cover: true,
      bio: true,
      birthDate: true,
      emailVerified: true,
      coins: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        select: {
          id: true,
          name: true,
        },
      },
      languages: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  return user;
};
```

### Criação de Usuário
```typescript
const createUser = async (data: CreateUserData) => {
  const validatedData = createUserSchema.parse(data);
  
  // Verificar se email já existe
  const existingEmail = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });
  
  if (existingEmail) {
    throw new Error("Email já está em uso");
  }
  
  // Verificar se username já existe (se fornecido)
  if (validatedData.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    
    if (existingUsername) {
      throw new Error("Username já está em uso");
    }
  }
  
  // Gerar username se não fornecido
  let username = validatedData.username;
  if (!username) {
    username = await generateUniqueUsername(validatedData.name);
  }
  
  // Hash da senha
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);
  
  // Validar categorias se fornecidas
  if (validatedData.categories && validatedData.categories.length > 0) {
    const categoriesCount = await prisma.category.count({
      where: {
        id: {
          in: validatedData.categories,
        },
      },
    });
    
    if (categoriesCount !== validatedData.categories.length) {
      throw new Error("Uma ou mais categorias não existem");
    }
  }
  
  // Validar idiomas se fornecidos
  if (validatedData.languages && validatedData.languages.length > 0) {
    const languagesCount = await prisma.language.count({
      where: {
        id: {
          in: validatedData.languages,
        },
      },
    });
    
    if (languagesCount !== validatedData.languages.length) {
      throw new Error("Um ou mais idiomas não existem");
    }
  }
  
  const user = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      username,
      avatar: validatedData.avatar,
      cover: validatedData.cover,
      bio: validatedData.bio,
      birthDate: validatedData.birthDate,
      emailVerified: true, // Admin-created users are auto-verified
      categories: validatedData.categories ? {
        connect: validatedData.categories.map(id => ({ id })),
      } : undefined,
      languages: validatedData.languages ? {
        connect: validatedData.languages.map(id => ({ id })),
      } : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      cover: true,
      bio: true,
      birthDate: true,
      emailVerified: true,
      coins: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  return user;
};
```

### Atualização de Usuário
```typescript
const updateUser = async (id: string, data: UpdateUserData) => {
  const validatedData = updateUserSchema.parse(data);
  
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new Error("Usuário não encontrado");
  }
  
  // Verificar conflitos de email
  if (validatedData.email && validatedData.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (emailExists) {
      throw new Error("Email já está em uso");
    }
  }
  
  // Verificar conflitos de username
  if (validatedData.username && validatedData.username !== existingUser.username) {
    const usernameExists = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    
    if (usernameExists) {
      throw new Error("Username já está em uso");
    }
  }
  
  // Hash da nova senha se fornecida
  let hashedPassword;
  if (validatedData.password) {
    hashedPassword = await bcrypt.hash(validatedData.password, 12);
  }
  
  // Validar categorias se fornecidas
  if (validatedData.categories && validatedData.categories.length > 0) {
    const categoriesCount = await prisma.category.count({
      where: {
        id: {
          in: validatedData.categories,
        },
      },
    });
    
    if (categoriesCount !== validatedData.categories.length) {
      throw new Error("Uma ou mais categorias não existem");
    }
  }
  
  // Validar idiomas se fornecidos
  if (validatedData.languages && validatedData.languages.length > 0) {
    const languagesCount = await prisma.language.count({
      where: {
        id: {
          in: validatedData.languages,
        },
      },
    });
    
    if (languagesCount !== validatedData.languages.length) {
      throw new Error("Um ou mais idiomas não existem");
    }
  }
  
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      username: validatedData.username,
      avatar: validatedData.avatar,
      cover: validatedData.cover,
      bio: validatedData.bio,
      birthDate: validatedData.birthDate,
      categories: validatedData.categories ? {
        set: validatedData.categories.map(id => ({ id })),
      } : undefined,
      languages: validatedData.languages ? {
        set: validatedData.languages.map(id => ({ id })),
      } : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      cover: true,
      bio: true,
      birthDate: true,
      emailVerified: true,
      coins: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  return updatedUser;
};
```

### Exclusão de Usuário
```typescript
const deleteUser = async (id: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  
  if (!existingUser) {
    throw new Error("Usuário não encontrado");
  }
  
  await prisma.user.delete({ where: { id } });
  return { message: "Usuário deletado com sucesso" };
};
```

### Operações de Moedas
```typescript
const addCoins = async (userId: string, data: CoinsOperationData) => {
  const validatedData = coinsOperationSchema.parse(data);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, coins: true },
  });
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  const previousBalance = user.coins;
  const newBalance = previousBalance + validatedData.amount;
  
  await prisma.user.update({
    where: { id: userId },
    data: { coins: newBalance },
  });
  
  return {
    userId,
    previousBalance,
    newBalance,
    operation: 'add' as const,
    amount: validatedData.amount,
    timestamp: new Date(),
  };
};

const removeCoins = async (userId: string, data: CoinsOperationData) => {
  const validatedData = coinsOperationSchema.parse(data);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, coins: true },
  });
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  if (user.coins < validatedData.amount) {
    throw new Error("Saldo insuficiente");
  }
  
  const previousBalance = user.coins;
  const newBalance = previousBalance - validatedData.amount;
  
  await prisma.user.update({
    where: { id: userId },
    data: { coins: newBalance },
  });
  
  return {
    userId,
    previousBalance,
    newBalance,
    operation: 'remove' as const,
    amount: validatedData.amount,
    timestamp: new Date(),
  };
};

const getCoins = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, coins: true },
  });
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  return {
    userId,
    balance: user.coins,
    timestamp: new Date(),
  };
};
```

### Utilitários
```typescript
const generateUniqueUsername = async (name: string): Promise<string> => {
  const baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!existing) {
      return username;
    }
    
    username = `${baseUsername}${counter}`;
    counter++;
  }
};
```

## Controladores HTTP

### Estrutura do Controller
```typescript
export const UsersController = {
  list: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const users = await UsersHandler.listUsers(
        Number(page),
        Number(limit)
      );
      res.json(users);
    } catch (error) {
      handleError(error, res);
    }
  },
  
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await UsersHandler.getUserById(id);
      res.json(user);
    } catch (error) {
      handleError(error, res);
    }
  },
  
  create: async (req: Request, res: Response) => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await UsersHandler.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      handleZodError(error, res);
    }
  },
  
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);
      const user = await UsersHandler.updateUser(id, validatedData);
      res.json(user);
    } catch (error) {
      handleZodError(error, res);
    }
  },
  
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await UsersHandler.deleteUser(id);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  },
  
  addCoins: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = coinsOperationSchema.parse(req.body);
      const result = await UsersHandler.addCoins(id, validatedData);
      res.json(result);
    } catch (error) {
      handleZodError(error, res);
    }
  },
  
  removeCoins: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = coinsOperationSchema.parse(req.body);
      const result = await UsersHandler.removeCoins(id, validatedData);
      res.json(result);
    } catch (error) {
      handleZodError(error, res);
    }
  },
  
  getCoins: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await UsersHandler.getCoins(id);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  },
};
```

## Configuração de Rotas

### Rotas Administrativas
```typescript
const AdminUsersRouter = Router();

// Middleware de autenticação e autorização
AdminUsersRouter.use(requireAuth);
AdminUsersRouter.use(requireAdmin);

// Rotas CRUD
AdminUsersRouter.get("/", UsersController.list);
AdminUsersRouter.get("/:id", UsersController.getById);
AdminUsersRouter.post("/", UsersController.create);
AdminUsersRouter.put("/:id", UsersController.update);
AdminUsersRouter.delete("/:id", UsersController.delete);

// Rotas de moedas
AdminUsersRouter.post("/:id/coins/add", UsersController.addCoins);
AdminUsersRouter.post("/:id/coins/remove", UsersController.removeCoins);
AdminUsersRouter.get("/:id/coins", UsersController.getCoins);

export { AdminUsersRouter };
```

## Tratamento de Erros

### Códigos de Status HTTP
- `200`: Operação realizada com sucesso
- `201`: Usuário criado com sucesso
- `400`: Dados inválidos ou parâmetros incorretos
- `401`: Não autorizado (token inválido)
- `403`: Acesso negado (não é administrador)
- `404`: Usuário não encontrado
- `409`: Conflito (email/username já existe)
- `422`: Saldo insuficiente para operação
- `500`: Erro interno do servidor

### Mensagens de Erro
```typescript
const errorMessages = {
  USER_NOT_FOUND: "Usuário não encontrado",
  EMAIL_IN_USE: "Email já está em uso",
  USERNAME_IN_USE: "Username já está em uso",
  INSUFFICIENT_BALANCE: "Saldo insuficiente",
  INVALID_CATEGORIES: "Uma ou mais categorias não existem",
  INVALID_LANGUAGES: "Um ou mais idiomas não existem",
  NAME_REQUIRED: "Nome é obrigatório",
  EMAIL_INVALID: "Email deve ser válido",
  PASSWORD_TOO_SHORT: "Senha deve ter pelo menos 6 caracteres",
  USERNAME_INVALID: "Username deve conter apenas letras, números e underscore",
  BIO_TOO_LONG: "Biografia deve ter no máximo 500 caracteres",
  COINS_POSITIVE: "Quantidade deve ser positiva",
  COINS_TOO_HIGH: "Quantidade máxima é 1.000.000"
};
```

### Tratamento Centralizado
```typescript
const handleUserError = (error: any, res: Response) => {
  if (error instanceof Error) {
    switch (error.message) {
      case "Usuário não encontrado":
        return res.status(404).json({ error: error.message });
      case "Email já está em uso":
      case "Username já está em uso":
        return res.status(409).json({ error: error.message });
      case "Saldo insuficiente":
        return res.status(422).json({ error: error.message });
      default:
        break;
    }
  }
  handleZodError(error, res);
};
```

## Dependências

### Internas
- **Auth Module**: Middlewares `requireAuth` e `requireAdmin`
- **Categories Module**: Relacionamento com categorias favoritas
- **Languages Module**: Relacionamento com idiomas preferidos
- **Utils**: Funções de tratamento de erros e paginação
- **Prisma**: Cliente do banco de dados

### Externas
- **Zod**: Validação de schemas e tipos
- **Express**: Framework web e tipos
- **bcrypt**: Hash de senhas
- **UUID**: Validação de identificadores únicos
- **Prisma**: ORM para acesso ao banco

## Segurança

### Autenticação
- **JWT Bearer Token**: Obrigatório para todas as operações
- **Middleware requireAuth**: Validação automática de token
- **User Context**: Injeção de dados do usuário autenticado

### Autorização
- **Role-based Access**: Apenas administradores podem gerenciar usuários
- **Middleware requireAdmin**: Controle de acesso administrativo
- **Operações restritas**: CRUD limitado a admins

### Proteção de Dados
- **Hash de senhas**: bcrypt com salt rounds 12
- **Validação de entrada**: Sanitização e validação rigorosa
- **Campos selecionados**: Exclusão de dados sensíveis
- **Prevenção de SQL injection**: Via Prisma ORM

### Validação de Entrada
- **Sanitização**: Limpeza automática com `.trim()` e `.toLowerCase()`
- **Validação de tipos**: Garantia de tipos corretos
- **Limites de tamanho**: Controle de comprimento de campos
- **Regex validation**: Validação de formato de username
- **URL validation**: Verificação de URLs de avatar e capa
- **Email validation**: Validação de formato de email

## Integração com Outros Módulos

### Auth Module
- **Registro de usuários**: Criação via auth vs. admin
- **Login e autenticação**: Validação de credenciais
- **Verificação de email**: Status de verificação
- **Reset de senha**: Atualização segura de senhas

### Categories Module
- **Categorias favoritas**: Relacionamento many-to-many
- **Preferências de usuário**: Filtros personalizados
- **Recomendações**: Baseadas em categorias favoritas
- **Estatísticas**: Análise de preferências

### Languages Module
- **Idiomas preferidos**: Relacionamento many-to-many
- **Localização**: Conteúdo no idioma preferido
- **Filtros de busca**: Mangás no idioma do usuário
- **Interface**: Tradução da UI

### Manga Module
- **Histórico de leitura**: Mangás lidos pelo usuário
- **Favoritos**: Mangás marcados como favoritos
- **Avaliações**: Ratings dados pelo usuário
- **Comentários**: Comentários do usuário

### Library Module
- **Biblioteca pessoal**: Mangás na biblioteca do usuário
- **Status de leitura**: Lendo, lido, quero ler
- **Progresso**: Capítulos lidos
- **Sincronização**: Dados entre dispositivos

### Collection Module
- **Coleções criadas**: Coleções do usuário
- **Coleções seguidas**: Coleções que o usuário segue
- **Colaborações**: Participação em coleções
- **Permissões**: Níveis de acesso

### Analytics Module
- **Métricas de usuário**: Atividade e engajamento
- **Análise de comportamento**: Padrões de leitura
- **Segmentação**: Grupos de usuários
- **Retenção**: Análise de retenção de usuários

## Sistema de Moedas Virtuais

### Funcionalidades
- **Saldo de moedas**: Cada usuário tem um saldo
- **Adição de moedas**: Operação administrativa
- **Remoção de moedas**: Com validação de saldo
- **Consulta de saldo**: Verificação atual
- **Histórico**: Registro de transações (futuro)

### Casos de Uso
- **Recompensas**: Por atividades no sistema
- **Compras**: Conteúdo premium ou recursos
- **Doações**: Entre usuários (futuro)
- **Eventos**: Promoções e campanhas
- **Gamificação**: Sistema de pontos e conquistas

### Validações
- **Quantidade positiva**: Apenas valores positivos
- **Saldo suficiente**: Para remoções
- **Limites**: Máximo de 1.000.000 por operação
- **Integridade**: Operações atômicas
- **Auditoria**: Log de todas as operações

## Considerações de Performance

### Otimizações de Query
- **Índices de banco**: Otimização para email, username
- **Selects específicos**: Apenas campos necessários
- **Paginação eficiente**: Limit/offset otimizado
- **Contagem paralela**: Total e dados em paralelo
- **Relacionamentos seletivos**: Includes apenas quando necessário

### Cache Strategy
- **Cache de perfil**: Dados de usuário frequentemente acessados
- **TTL médio**: Cache de 15-30 minutos
- **Invalidação por evento**: Limpeza após atualizações
- **Cache warming**: Pré-aquecimento de usuários ativos

### Limitações
- **Paginação obrigatória**: Máximo 100 usuários por página
- **Rate limiting**: Proteção contra criação em massa
- **Validação rigorosa**: Prevenção de dados inválidos
- **Operações atômicas**: Consistência de dados

## Próximas Melhorias

### Funcionalidades Avançadas
- [ ] **Perfil público**: Visualização pública de perfis
- [ ] **Sistema de seguir**: Seguir outros usuários
- [ ] **Notificações**: Sistema de notificações
- [ ] **Configurações avançadas**: Preferências detalhadas
- [ ] **Verificação de identidade**: Verificação de contas

### Sistema de Moedas
- [ ] **Histórico de transações**: Log completo de operações
- [ ] **Transferências**: Entre usuários
- [ ] **Marketplace**: Compra e venda de itens
- [ ] **Recompensas automáticas**: Por atividades
- [ ] **Níveis de usuário**: Sistema de progressão

### Gamificação
- [ ] **Sistema de conquistas**: Badges e achievements
- [ ] **Ranking de usuários**: Leaderboards
- [ ] **Eventos**: Competições e desafios
- [ ] **Recompensas diárias**: Login rewards
- [ ] **Missões**: Tarefas para ganhar moedas

### Social Features
- [ ] **Feed de atividades**: Timeline de ações
- [ ] **Grupos de usuários**: Comunidades
- [ ] **Chat**: Mensagens entre usuários
- [ ] **Fóruns**: Discussões por tópicos
- [ ] **Reviews sociais**: Avaliações compartilhadas

### Analytics
- [ ] **Dashboard de usuário**: Estatísticas pessoais
- [ ] **Relatórios de atividade**: Análise de comportamento
- [ ] **Métricas de engajamento**: Tempo no app, páginas visitadas
- [ ] **Análise preditiva**: Recomendações baseadas em ML
- [ ] **Segmentação avançada**: Grupos de usuários similares

### Performance
- [ ] **Elasticsearch**: Busca avançada de usuários
- [ ] **Cache distribuído**: Redis para alta disponibilidade
- [ ] **CDN**: Cache de avatares e imagens
- [ ] **Lazy loading**: Carregamento sob demanda
- [ ] **Compressão de imagens**: Otimização automática

### UX/UI
- [ ] **Upload de imagens**: Sistema próprio de upload
- [ ] **Crop de imagens**: Edição de avatar e capa
- [ ] **Temas personalizados**: Customização visual
- [ ] **Acessibilidade**: Melhorias de acessibilidade
- [ ] **PWA**: Progressive Web App features

## Testes

### Testes Unitários
- **Handlers**: Lógica de negócio isolada
- **Validação**: Schemas e funções de validação
- **Utilitários**: Funções auxiliares
- **Operações de moedas**: Lógica de transações

### Testes de Integração
- **Endpoints**: Fluxo completo da API
- **Autenticação**: Middleware de auth
- **Autorização**: Controle de acesso admin
- **Banco de dados**: Operações CRUD
- **Relacionamentos**: Integridade com outros módulos

### Testes de Segurança
- **Autorização**: Tentativas de bypass
- **Validação**: Dados maliciosos
- **SQL Injection**: Proteção via ORM
- **XSS**: Sanitização de entrada
- **Rate limiting**: Proteção contra abuso

### Testes de Performance
- **Load testing**: Carga de listagem
- **Stress testing**: Limites do sistema
- **Cache efficiency**: Eficiência do cache
- **Query optimization**: Otimização de consultas
- **Memory usage**: Uso de memória

### Cobertura de Testes
- **Cenários positivos**: Fluxos de sucesso
- **Cenários negativos**: Tratamento de erros
- **Edge cases**: Casos extremos
- **Validação de dados**: Todos os campos
- **Operações de moedas**: Todos os cenários

## Documentação Swagger

Todos os endpoints estão documentados com Swagger/OpenAPI, incluindo:
- **Schemas detalhados**: Request/response completos
- **Códigos de status**: Todos os cenários possíveis
- **Exemplos práticos**: Casos de uso reais
- **Autenticação**: Configuração de Bearer token
- **Autorização**: Requisitos de admin
- **Parâmetros**: Descrição completa de cada campo
- **Validação**: Regras de validação documentadas
- **Operações de moedas**: Documentação específica

Acesse `/api-docs` para visualizar a documentação interativa.

## Considerações de Arquitetura

### Separação de Responsabilidades
- **Controllers**: Apenas validação e resposta HTTP
- **Handlers**: Lógica de negócio pura
- **Validators**: Schemas de validação isolados
- **Routes**: Configuração de rotas e middlewares
- **Utils**: Funções auxiliares reutilizáveis

### Padrões de Design
- **Repository Pattern**: Abstração de acesso a dados
- **Service Layer**: Lógica de negócio centralizada
- **DTO Pattern**: Objetos de transferência de dados
- **Error Handling**: Tratamento centralizado de erros
- **Validation Layer**: Validação em camadas

### Escalabilidade
- **Modular**: Fácil extensão e manutenção
- **Testável**: Componentes isolados e testáveis
- **Reutilizável**: Código compartilhável entre módulos
- **Configurável**: Parâmetros externalizados
- **Monitorável**: Logs e métricas integradas