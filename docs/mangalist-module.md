# Módulo MangaList

## Visão Geral

O módulo **MangaList** é responsável pela gestão de listas de mangás na plataforma S2Mangas. Ele oferece funcionalidades completas para criação, edição, organização e compartilhamento de listas personalizadas de mangás, permitindo aos usuários organizar suas coleções de forma eficiente e descobrir novas recomendações.

## Estrutura de Diretórios

```
src/modules/mangalist/
├── controllers/
│   └── MangalistController.ts     # Controladores HTTP e documentação Swagger
├── handlers/
│   └── MangaListHandler.ts        # Lógica de negócio
├── routes/
│   ├── MangaListRouter.ts         # Rotas públicas
│   └── AdminMangaListRouter.ts    # Rotas administrativas
└── validators/
    └── MangalistValidators.ts     # Schemas de validação Zod
```

## Funcionalidades Principais

### 1. Gestão de Listas
- **Criação de listas**: Listas personalizadas com nome, capa e mood
- **Edição de listas**: Atualização de metadados e configurações
- **Exclusão de listas**: Remoção completa com validações
- **Status de visibilidade**: Privada, pública ou não listada

### 2. Gestão de Itens
- **Adição de mangás**: Inserção individual ou em lote
- **Reordenação**: Organização customizada dos itens
- **Notas personalizadas**: Comentários por mangá
- **Remoção de itens**: Exclusão seletiva

### 3. Funcionalidades Avançadas
- **Filtros e busca**: Por mood, status, usuário e texto
- **Estatísticas**: Contadores de itens e curtidas
- **Paginação**: Listagem eficiente de grandes coleções
- **Ordenação**: Por data, nome ou popularidade

## Endpoints da API

### Rotas Públicas

#### `GET /mangalist`
- **Descrição**: Lista todas as listas de mangás com filtros
- **Autenticação**: Obrigatória
- **Parâmetros de Query**:
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (máximo: 100, padrão: 20)
  - `userId` (opcional): Filtrar por usuário (UUID)
  - `status` (opcional): Filtrar por status (PRIVATE, PUBLIC, UNLISTED)
  - `mood` (opcional): Filtrar por mood
  - `search` (opcional): Buscar por nome ou descrição
  - `sortBy` (opcional): Ordenar por (createdAt, updatedAt, name, likesCount)
  - `sortOrder` (opcional): Ordem (asc, desc)
- **Resposta**: Lista paginada de listas de mangás

#### `GET /mangalist/public`
- **Descrição**: Lista apenas listas públicas
- **Autenticação**: Obrigatória
- **Parâmetros**: Similares ao endpoint principal
- **Resposta**: Lista paginada de listas públicas

#### `GET /mangalist/:id`
- **Descrição**: Obtém uma lista específica com seus itens
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `id`: ID da lista (UUID)
- **Resposta**: Dados completos da lista com itens

#### `GET /mangalist/:id/stats`
- **Descrição**: Obtém estatísticas de uma lista
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `id`: ID da lista (UUID)
- **Resposta**: Estatísticas detalhadas da lista

#### `GET /mangalist/mood/:mood`
- **Descrição**: Lista listas por mood específico
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `mood`: Mood da lista
- **Resposta**: Lista de listas com o mood especificado

### Rotas Administrativas

#### `POST /admin/mangalist`
- **Descrição**: Cria uma nova lista de mangás
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Corpo da Requisição**:
  ```json
  {
    "name": "string",
    "cover": "string (URL)",
    "mood": "string",
    "description": "string (opcional)",
    "status": "PRIVATE|PUBLIC|UNLISTED",
    "isDefault": "boolean",
    "mangaIds": ["UUID"] // opcional
  }
  ```
- **Resposta**: Lista criada com metadados

#### `PUT /admin/mangalist/:id`
- **Descrição**: Atualiza uma lista existente
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da lista (UUID)
- **Corpo da Requisição**: Campos opcionais para atualização
- **Resposta**: Lista atualizada

#### `DELETE /admin/mangalist/:id`
- **Descrição**: Remove uma lista completamente
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da lista (UUID)
- **Resposta**: Confirmação de exclusão

#### `POST /admin/mangalist/:id/items`
- **Descrição**: Adiciona um mangá à lista
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da lista (UUID)
- **Corpo da Requisição**:
  ```json
  {
    "mangaId": "UUID",
    "order": "number (opcional)",
    "note": "string (opcional)"
  }
  ```
- **Resposta**: Item adicionado com dados do mangá

#### `POST /admin/mangalist/:id/items/bulk`
- **Descrição**: Adiciona múltiplos mangás à lista
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da lista (UUID)
- **Corpo da Requisição**:
  ```json
  {
    "mangaIds": ["UUID"],
    "notes": {
      "mangaId": "nota"
    }
  }
  ```
- **Resposta**: Resultado com contadores de adicionados/ignorados

#### `PUT /admin/mangalist/:id/items/reorder`
- **Descrição**: Reordena os itens da lista
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da lista (UUID)
- **Corpo da Requisição**:
  ```json
  {
    "items": [
      {
        "id": "UUID",
        "order": "number"
      }
    ]
  }
  ```
- **Resposta**: Confirmação de reordenação

#### `PUT /admin/mangalist/:listId/items/:itemId`
- **Descrição**: Atualiza um item específico da lista
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `listId`: ID da lista (UUID)
  - `itemId`: ID do item (UUID)
- **Corpo da Requisição**:
  ```json
  {
    "order": "number (opcional)",
    "note": "string (opcional)"
  }
  ```
- **Resposta**: Item atualizado

#### `DELETE /admin/mangalist/:listId/items/:itemId`
- **Descrição**: Remove um item da lista
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `listId`: ID da lista (UUID)
  - `itemId`: ID do item (UUID)
- **Resposta**: Confirmação de remoção (204)

## Schemas de Dados

### MangaList
```typescript
{
  id: string;              // UUID da lista
  name: string;            // Nome da lista (1-100 chars)
  cover: string;           // URL da capa
  mood: string;            // Mood da lista (1-50 chars)
  description?: string;    // Descrição (máx 500 chars)
  status: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault: boolean;      // Se é lista padrão
  createdAt: Date;         // Data de criação
  updatedAt: Date;         // Última atualização
  items: MangaListItem[];  // Itens da lista
  _count: {
    items: number;         // Número de itens
    likes: number;         // Número de curtidas
  }
}
```

### MangaListItem
```typescript
{
  id: string;              // UUID do item
  mangaListId: string;     // ID da lista
  mangaId: string;         // ID do mangá
  order: number;           // Ordem na lista
  note?: string;           // Nota sobre o mangá (máx 200 chars)
  manga: {
    id: string;
    title: string;
    cover: string;
    status: string;
  }
}
```

### BulkAddResult
```typescript
{
  added: number;           // Mangás adicionados
  skipped: number;         // Mangás ignorados
}
```

## Validação de Dados

O módulo utiliza **Zod** para validação robusta:

### Schemas de Validação
- **createMangaListSchema**: Criação de listas
- **updateMangaListSchema**: Atualização de listas
- **addMangaToListSchema**: Adição de mangás
- **updateMangaListItemSchema**: Atualização de itens
- **reorderMangaListItemsSchema**: Reordenação
- **bulkAddToMangaListSchema**: Adição em lote
- **mangaListFiltersSchema**: Filtros de busca

### Regras de Validação
- Nome da lista: 1-100 caracteres
- Mood: 1-50 caracteres
- Descrição: máximo 500 caracteres
- Notas: máximo 200 caracteres
- IDs: formato UUID válido
- Status: enum restrito
- Ordem: números inteiros não negativos

## Lógica de Negócio

### Handlers Principais

#### `createMangaList`
- Valida dados de entrada
- Cria lista no banco de dados
- Adiciona mangás iniciais se fornecidos
- Verifica existência dos mangás
- Retorna lista com contadores

#### `updateMangaList`
- Verifica existência da lista
- Atualiza campos fornecidos
- Mantém integridade dos dados
- Retorna lista atualizada

#### `addMangaToList`
- Verifica existência da lista e mangá
- Previne duplicatas
- Calcula ordem automática
- Inclui dados do mangá na resposta

#### `bulkAddMangasToList`
- Processa múltiplos mangás
- Ignora duplicatas e inexistentes
- Retorna estatísticas de processamento
- Otimiza operações de banco

#### `reorderMangaListItems`
- Valida pertencimento dos itens
- Atualiza ordem em lote
- Mantém consistência da lista

#### `updateMangaListItem`
- Verifica existência do item
- Atualiza campos específicos
- Mantém relações intactas

## Controladores HTTP

O `MangalistController.ts` implementa:
- Validação de entrada com Zod
- Tratamento de erros padronizado
- Respostas HTTP apropriadas
- Documentação Swagger detalhada
- Integração com handlers de negócio

## Configuração de Rotas

### MangaListRouter (Público)
- Rotas de consulta e visualização
- Autenticação obrigatória
- Acesso a listas públicas
- Filtros e paginação

### AdminMangaListRouter (Administrativo)
- Rotas de criação e modificação
- Autenticação + privilégios de admin
- Operações CRUD completas
- Gestão avançada de itens

## Tratamento de Erros

### Classes de Erro Customizadas
- **MangaListNotFoundError**: Lista não encontrada
- **MangaNotFoundError**: Mangá não encontrado
- **MangaAlreadyInListError**: Mangá já na lista
- **MangaListItemNotFoundError**: Item não encontrado
- **InvalidMangaListDataError**: Dados inválidos

### Códigos de Status
- `200`: Operação bem-sucedida
- `201`: Recurso criado
- `204`: Remoção bem-sucedida
- `400`: Dados inválidos
- `401`: Não autenticado
- `403`: Sem privilégios
- `404`: Recurso não encontrado
- `409`: Conflito (duplicata)
- `500`: Erro interno

## Dependências

### Principais
- **Express**: Framework web
- **Zod**: Validação de schemas
- **Prisma**: ORM para banco de dados
- **JWT**: Autenticação de usuários

### Middlewares
- `requireAuth`: Autenticação obrigatória
- `requireAdmin`: Privilégios administrativos
- `handleZodError`: Tratamento de erros de validação

## Segurança

### Autenticação e Autorização
- Todas as rotas exigem autenticação
- Rotas administrativas exigem privilégios especiais
- Verificação de propriedade de recursos
- Validação de tokens JWT

### Validação de Dados
- Sanitização rigorosa de entrada
- Validação de tipos e formatos
- Prevenção de ataques de injeção
- Limitação de tamanhos de dados

### Proteção de Dados
- Controle de acesso por status
- Filtragem de dados sensíveis
- Logs de auditoria
- Rate limiting implícito

## Integração com Outros Módulos

### Dependências
- **Auth**: Sistema de autenticação
- **Manga**: Dados dos mangás
- **Users**: Informações de usuários
- **Files**: Gestão de capas

### Integrações
- Sistema de curtidas
- Notificações de atividades
- Cache de dados frequentes
- Análise de comportamento

## Considerações de Performance

### Otimizações
- Paginação em todas as listagens
- Índices otimizados no banco
- Cache de listas populares
- Lazy loading de itens

### Limitações
- Máximo 100 itens por página
- Limite de caracteres em campos texto
- Timeout em operações complexas
- Throttling de criação de listas

### Estratégias de Melhoria
- Cache Redis para listas frequentes
- Pré-computação de estatísticas
- Otimização de queries complexas
- Compressão de dados grandes

## Próximas Melhorias

### Funcionalidades
- [ ] Sistema de colaboração em listas
- [ ] Templates de listas predefinidas
- [ ] Importação/exportação de listas
- [ ] Recomendações automáticas
- [ ] Histórico de modificações

### Técnicas
- [ ] Cache distribuído
- [ ] Busca com Elasticsearch
- [ ] Processamento assíncrono
- [ ] Otimização de imagens

### Segurança
- [ ] Rate limiting por usuário
- [ ] Detecção de spam
- [ ] Auditoria completa
- [ ] Backup automático

## Testes

### Cenários de Teste
- Criação e edição de listas
- Adição e remoção de mangás
- Reordenação de itens
- Filtros e busca
- Operações em lote
- Tratamento de erros

### Testes de Integração
- Fluxo completo de gestão
- Integração com autenticação
- Sincronização com outros módulos
- Performance sob carga

### Cobertura de Testes
- Handlers de negócio: 90%+
- Controladores HTTP: 85%+
- Validação de dados: 95%+
- Casos de erro: 80%+

## Documentação Swagger

O módulo possui documentação Swagger completa incluindo:
- Schemas detalhados de todos os objetos
- Exemplos de requisições e respostas
- Códigos de status e mensagens de erro
- Parâmetros obrigatórios e opcionais
- Informações de autenticação e autorização
- Tags organizadas por funcionalidade

---

*Documentação gerada automaticamente para o módulo MangaList do S2Mangas*