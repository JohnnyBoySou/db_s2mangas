# Testes do Módulo Discover - Nova Arquitetura

Este diretório contém todos os testes para o módulo discover reestruturado seguindo o padrão de arquitetura limpa.

## Nova Estrutura do Módulo

```
discover/
├── controllers/
│   └── DiscoverController.ts     # Gerencia requests HTTP e responses
├── useCases/
│   └── DiscoverUseCase.ts        # Orquestra a lógica de negócio
├── services/
│   └── DiscoverService.ts        # Lógica de negócio pura
├── repositories/
│   └── DiscoverRepository.ts     # Consultas Prisma e acesso a dados
├── validators/
│   └── discoverSchemas.ts        # Validação de entrada (Zod)
├── DiscoverRouter.ts             # Rotas Express
└── __tests__/
    ├── DiscoverRepository.test.ts
    ├── DiscoverIntegration.test.ts
    └── README.md
```

## Separação de Responsabilidades

### 1. **Repository Layer** (`DiscoverRepository.ts`)
- **Responsabilidade**: Acesso aos dados e consultas Prisma
- **Testes**: `DiscoverRepository.test.ts`
- **O que testa**:
  - Consultas específicas ao banco de dados
  - Filtros e ordenação
  - Paginação no nível de banco
  - Contagem de registros

### 2. **Service Layer** (`DiscoverService.ts`)
- **Responsabilidade**: Lógica de negócio pura, sem dependências externas
- **Funcionalidades**:
  - Tradução de mangás por idioma
  - Processamento de dados
  - Validações de regras de negócio
  - Cálculos de paginação
  - Extração de categorias de usuário

### 3. **Use Case Layer** (`DiscoverUseCase.ts`)
- **Responsabilidade**: Orquestração da lógica de negócio
- **Funcionalidades**:
  - Coordena Repository e Service
  - Implementa fluxos completos de negócio
  - Gerencia transações e estado

### 4. **Controller Layer** (`DiscoverController.ts`)
- **Responsabilidade**: Interface HTTP
- **Funcionalidades**:
  - Recebe requests HTTP
  - Valida entrada usando schemas
  - Chama Use Cases
  - Retorna responses HTTP formatadas

### 5. **Validator Layer** (`discoverSchemas.ts`)
- **Responsabilidade**: Validação e sanitização de entrada
- **Funcionalidades**:
  - Schemas Zod para validação
  - Normalização de idiomas
  - Validação de paginação
  - Validação de UUIDs

## Arquivos de Teste

### `DiscoverRepository.test.ts`
Testa a camada de acesso a dados:
- Consultas Prisma
- Filtros por idioma
- Ordenação por views/likes
- Busca de usuários com categorias
- Paginação

### `DiscoverIntegration.test.ts`
Testa o fluxo completo da aplicação:
- Rotas HTTP end-to-end
- Integração entre todas as camadas
- Middleware de autenticação
- Middleware de cache
- Tratamento de erros
- Validação de entrada

## Executando os Testes

### Todos os testes do módulo discover:
```bash
npm test -- src/modules/discover/__tests__/
```

### Teste específico:
```bash
npm test -- src/modules/discover/__tests__/DiscoverRepository.test.ts
```

### Com cobertura:
```bash
npm test -- --coverage src/modules/discover/__tests__/
```

## Vantagens da Nova Arquitetura

### 1. **Separação Clara de Responsabilidades**
- Cada camada tem uma responsabilidade específica
- Facilita manutenção e extensão
- Reduz acoplamento entre componentes

### 2. **Testabilidade**
- Cada camada pode ser testada independentemente
- Mocks mais simples e específicos
- Testes mais focados e rápidos

### 3. **Reutilização**
- Services podem ser reutilizados em diferentes Use Cases
- Repositories podem ser compartilhados
- Validadores consistentes

### 4. **Manutenibilidade**
- Mudanças isoladas por camada
- Refatoração mais segura
- Código mais legível

### 5. **Escalabilidade**
- Fácil adição de novos endpoints
- Extensão de funcionalidades
- Suporte a diferentes interfaces (REST, GraphQL, etc.)

## Padrões de Teste

### Repository Tests
```typescript
describe('DiscoverRepository', () => {
  beforeEach(() => {
    // Setup mocks do Prisma
  });

  it('deve buscar mangás com filtros corretos', async () => {
    // Given - dados de entrada
    // When - chamada do método
    // Then - verificação dos resultados e chamadas Prisma
  });
});
```

### Integration Tests
```typescript
describe('Discover Integration', () => {
  beforeEach(() => {
    // Setup da aplicação Express
    // Mock de middlewares
  });

  it('deve retornar dados via HTTP', async () => {
    // Given - setup de mocks
    // When - request HTTP
    // Then - verificação da response
  });
});
```

## Próximos Passos

1. ✅ Reestruturação completa para arquitetura limpa
2. ✅ Testes para Repository layer
3. ✅ Testes de integração
4. 🔄 Testes unitários para Service layer
5. 🔄 Testes unitários para Use Case layer
6. 🔄 Testes unitários para Validators
7. 🔄 Testes de performance
8. 🔄 Testes de carga
9. 🔄 Documentação de APIs

## Dependências de Teste

- **Jest**: Framework de testes
- **Supertest**: Testes HTTP
- **@jest/globals**: Tipos Jest
- **Prisma Mock**: Mock do cliente Prisma
- **Zod**: Validação de schemas

## Configuração de Mock

### Prisma
```typescript
const mockPrisma = {
  manga: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/prisma/client', () => ({ default: mockPrisma }));
```

### Middlewares
```typescript
jest.mock('@/middlewares/auth', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = { id: 'user-123' };
    next();
  }),
})); 