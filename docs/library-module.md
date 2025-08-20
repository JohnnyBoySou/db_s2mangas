# Módulo Library

## Visão Geral

O módulo `library` é responsável pela gestão da biblioteca pessoal dos usuários, permitindo que eles organizem e acompanhem o progresso de leitura dos mangás. Este módulo oferece funcionalidades para marcar mangás como lidos, favoritos, seguidos ou completos, além de fornecer listagens filtradas por tipo.

## Estrutura de Diretórios

```
src/modules/library/
├── controllers/
│   └── LibraryController.ts      # Controladores HTTP e documentação Swagger
├── handlers/
│   └── LibraryHandler.ts          # Lógica de negócio da biblioteca
├── routes/
│   └── LibraryRouter.ts           # Definição das rotas da API
├── validators/
│   └── LibraryValidator.ts        # Schemas de validação Zod
└── tests/
    └── *.test.ts                  # Testes unitários
```

## Funcionalidades Principais

### 1. Gestão de Entradas da Biblioteca
- **Upsert de Entradas**: Criação ou atualização de entradas na biblioteca
- **Atualização de Flags**: Modificação de status específicos (lido, curtido, seguido, completo)
- **Remoção de Entradas**: Exclusão de mangás da biblioteca pessoal
- **Verificação de Status**: Consulta do status atual de um mangá na biblioteca

### 2. Sistema de Flags
- **isRead**: Indica se o mangá foi lido (progresso de leitura)
- **isLiked**: Marca mangás como favoritos
- **isFollowed**: Acompanha mangás de interesse
- **isComplete**: Marca mangás como completamente lidos

### 3. Listagem por Tipo
- **Progress**: Mangás em progresso de leitura (`isRead: true`)
- **Complete**: Mangás completamente lidos (`isComplete: true`)
- **Favorite**: Mangás favoritos (`isLiked: true`)
- **Following**: Mangás sendo seguidos (`isFollowed: true`)

### 4. Toggle de Status
- Alternância rápida de flags específicos
- Criação automática de entrada se não existir
- Inversão do valor atual do flag

## Schemas de Validação

### LibraryValidator.ts

```typescript
// Schema para upsert (criar/atualizar)
export const upsertSchema = z.object({
  mangaId: z.string().uuid(),
  isRead: z.boolean().optional(),
  isLiked: z.boolean().optional(),
  isFollowed: z.boolean().optional(),
  isComplete: z.boolean().optional(),
});

// Schema para atualização de flags
export const updateFlagsSchema = z.object({
  mangaId: z.string().uuid(),
  isRead: z.boolean().optional(),
  isLiked: z.boolean().optional(),
  isFollowed: z.boolean().optional(),
  isComplete: z.boolean().optional(),
});
```

## Rotas da API

### Rotas Principais

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|-------------|
| `POST` | `/library` | Criar/atualizar entrada na biblioteca | ✅ |
| `PATCH` | `/library` | Atualizar flags específicos | ✅ |
| `GET` | `/library/{type}` | Listar biblioteca por tipo | ✅ |
| `DELETE` | `/library/{mangaId}` | Remover entrada da biblioteca | ✅ |
| `POST` | `/library/{type}/toggle/{mangaId}` | Alternar status de flag | ✅ |
| `GET` | `/library/status/{mangaId}` | Verificar status de um mangá | ✅ |

### Parâmetros de Tipo
- `progress`: Mangás em progresso
- `complete`: Mangás completos
- `favorite`: Mangás favoritos
- `following`: Mangás seguidos

### Exemplos de Uso

```bash
# Adicionar mangá aos favoritos
POST /library
{
  "mangaId": "123e4567-e89b-12d3-a456-426614174000",
  "isLiked": true
}

# Listar mangás favoritos
GET /library/favorite?page=1&limit=10

# Alternar status de seguido
POST /library/following/toggle/123e4567-e89b-12d3-a456-426614174000

# Verificar status de um mangá
GET /library/status/123e4567-e89b-12d3-a456-426614174000
```

## Middlewares

### Autenticação
- **requireAuth**: Todas as rotas requerem autenticação
- Validação de token JWT
- Extração do ID do usuário do token

## Funcionalidades Avançadas

### 1. Paginação
- Suporte completo a paginação em listagens
- Parâmetros: `page`, `limit`
- Metadados de paginação incluídos na resposta

### 2. Ordenação
- Listagens ordenadas por `updatedAt` (mais recentes primeiro)
- Garante que alterações recentes apareçam no topo

### 3. Inclusão de Dados do Mangá
- Informações básicas do mangá incluídas nas listagens
- Traduções de nome por idioma
- Contagem de visualizações
- Capa do mangá

### 4. Operações Atômicas
- Uso de `upsert` para operações seguras
- Transações implícitas do Prisma
- Consistência de dados garantida

## Tratamento de Erros

### Validação
- Validação de UUIDs para `mangaId`
- Validação de tipos de biblioteca
- Tratamento de erros Zod com `handleZodError`

### Erros de Negócio
- Mangá não encontrado (404)
- Entrada da biblioteca não encontrada (404)
- Tipo de biblioteca inválido (400)
- Dados de entrada inválidos (400)

### Códigos de Status HTTP
- `200`: Operação bem-sucedida
- `204`: Remoção bem-sucedida
- `400`: Dados inválidos
- `401`: Não autorizado
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

## Dependências

### Principais
- **@prisma/client**: ORM para acesso ao banco de dados
- **zod**: Validação de schemas
- **express**: Framework web

### Utilitários
- **@/utils/pagination**: Helpers de paginação
- **@/utils/zodError**: Tratamento de erros de validação
- **@/middlewares/auth**: Middleware de autenticação

## Testes

### Cobertura de Testes
- Testes unitários para todos os handlers
- Testes de validação de schemas
- Testes de integração com banco de dados
- Testes de middlewares de autenticação

### Cenários Testados
- Criação e atualização de entradas
- Listagem por diferentes tipos
- Toggle de flags
- Verificação de status
- Remoção de entradas
- Casos de erro e validação

## Próximas Melhorias

### Funcionalidades Planejadas
1. **Progresso de Capítulos**: Rastreamento detalhado de capítulos lidos
2. **Notas Pessoais**: Adição de notas e comentários pessoais
3. **Avaliações**: Sistema de avaliação pessoal (1-5 estrelas)
4. **Estatísticas**: Métricas de leitura e tempo gasto
5. **Exportação**: Exportar biblioteca em diferentes formatos
6. **Sincronização**: Backup e sincronização entre dispositivos

### Otimizações
1. **Cache**: Implementação de cache para listagens frequentes
2. **Índices**: Otimização de consultas no banco de dados
3. **Bulk Operations**: Operações em lote para múltiplos mangás
4. **Lazy Loading**: Carregamento sob demanda de dados do mangá

## Integração com Outros Módulos

### Dependências
- **manga**: Validação de existência de mangás
- **auth**: Autenticação e autorização de usuários
- **users**: Informações do usuário proprietário

### Integrações
- **analytics**: Métricas de uso da biblioteca
- **recommendations**: Recomendações baseadas na biblioteca
- **collection**: Sincronização com coleções públicas

## Considerações de Segurança

### Autenticação
- Todas as operações requerem autenticação válida
- Isolamento de dados por usuário
- Validação de propriedade das entradas

### Autorização
- Usuários só podem acessar sua própria biblioteca
- Validação de permissões em todas as operações
- Prevenção de acesso não autorizado

### Validação de Dados
- Sanitização de entradas
- Validação de tipos e formatos
- Prevenção de ataques de injeção

### Auditoria
- Log de operações críticas
- Rastreamento de alterações
- Monitoramento de uso suspeito

## Modelo de Dados

### LibraryEntry
```typescript
interface LibraryEntry {
  id: string;           // UUID único
  userId: string;       // ID do usuário
  mangaId: string;      // ID do mangá
  isRead: boolean;      // Progresso de leitura
  isLiked: boolean;     // Favorito
  isFollowed: boolean;  // Seguindo
  isComplete: boolean;  // Completo
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Última atualização
}
```

### Relacionamentos
- **User**: Relacionamento many-to-one com usuários
- **Manga**: Relacionamento many-to-one com mangás
- **Constraint**: Chave única composta (userId, mangaId)

Este módulo é fundamental para a experiência personalizada dos usuários, permitindo que organizem e acompanhem sua jornada de leitura de mangás de forma eficiente e intuitiva.