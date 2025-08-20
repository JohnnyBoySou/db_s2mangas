# Módulo Playlists

## Visão Geral

O módulo **Playlists** é responsável pela gestão de playlists e tags na plataforma S2Mangas. Ele oferece funcionalidades completas para criação, edição, organização e categorização de playlists de conteúdo, permitindo aos usuários descobrir e organizar coleções temáticas de mangás através de um sistema de tags flexível.

## Estrutura de Diretórios

```
src/modules/playlists/
├── __tests__/                    # Testes do módulo
├── controllers/
│   └── PlaylistController.ts     # Controladores HTTP e documentação Swagger
├── handlers/
│   └── PlaylistHandler.ts        # Lógica de negócio
├── routes/
│   └── PlaylistRouter.ts         # Configuração de rotas
└── valitators/
    └── playlistSchema.ts         # Schemas de validação Zod
```

## Funcionalidades Principais

### 1. Gestão de Playlists
- **Criação de playlists**: Playlists com nome, capa, link e descrição
- **Edição de playlists**: Atualização de metadados e tags
- **Exclusão de playlists**: Remoção completa com validações
- **Listagem paginada**: Visualização eficiente de grandes coleções

### 2. Sistema de Tags
- **Criação de tags**: Tags com nome e cor personalizável
- **Gestão de tags**: Edição e remoção de tags existentes
- **Associação de tags**: Vinculação flexível entre playlists e tags
- **Filtragem por tags**: Busca de playlists por múltiplas tags

### 3. Funcionalidades Avançadas
- **Filtros dinâmicos**: Por tag específica ou múltiplas tags
- **Paginação otimizada**: Listagem eficiente com metadados
- **Contadores automáticos**: Estatísticas de uso das tags
- **Ordenação**: Por data de criação e nome

## Endpoints da API

### Rotas Públicas (Consulta)

#### `GET /playlists`
- **Descrição**: Lista todas as playlists com paginação e filtros
- **Autenticação**: Obrigatória
- **Parâmetros de Query**:
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (máximo: 100, padrão: 10)
  - `tagId` (opcional): Filtrar por tag específica (UUID)
- **Resposta**: Lista paginada de playlists com tags

#### `GET /playlists/by-tags`
- **Descrição**: Lista playlists filtradas por múltiplas tags
- **Autenticação**: Obrigatória
- **Parâmetros de Query**:
  - `tagIds` (obrigatório): IDs das tags separados por vírgula
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (máximo: 100, padrão: 10)
- **Resposta**: Lista paginada de playlists que contêm as tags especificadas

#### `GET /playlists/:id`
- **Descrição**: Obtém uma playlist específica com suas tags
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `id`: ID da playlist (UUID)
- **Resposta**: Dados completos da playlist com tags associadas

#### `GET /playlists/tags/all`
- **Descrição**: Lista todas as tags disponíveis
- **Autenticação**: Obrigatória
- **Resposta**: Lista de todas as tags com contadores de uso

### Rotas Administrativas

#### `POST /admin/playlists`
- **Descrição**: Cria uma nova playlist
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Corpo da Requisição**:
  ```json
  {
    "name": "string",
    "cover": "string (URL)",
    "link": "string (URL)",
    "description": "string (opcional)",
    "tags": ["UUID"] // opcional
  }
  ```
- **Resposta**: Playlist criada com tags associadas

#### `PUT /admin/playlists/:id`
- **Descrição**: Atualiza uma playlist existente
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da playlist (UUID)
- **Corpo da Requisição**: Campos opcionais para atualização
- **Resposta**: Playlist atualizada com tags

#### `DELETE /admin/playlists/:id`
- **Descrição**: Remove uma playlist completamente
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da playlist (UUID)
- **Resposta**: Confirmação de exclusão (204)

#### `POST /admin/playlists/tags`
- **Descrição**: Cria uma nova tag
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Corpo da Requisição**:
  ```json
  {
    "name": "string (1-50 chars)",
    "color": "string (hex color, opcional)"
  }
  ```
- **Resposta**: Tag criada

#### `PUT /admin/playlists/tags/:id`
- **Descrição**: Atualiza uma tag existente
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da tag (UUID)
- **Corpo da Requisição**: Campos opcionais para atualização
- **Resposta**: Tag atualizada

#### `DELETE /admin/playlists/tags/:id`
- **Descrição**: Remove uma tag
- **Autenticação**: Obrigatória + Privilégios de administrador
- **Parâmetros de Rota**:
  - `id`: ID da tag (UUID)
- **Resposta**: Confirmação de exclusão (204)

## Schemas de Dados

### Playlist
```typescript
{
  id: string;              // UUID da playlist
  name: string;            // Nome da playlist
  cover: string;           // URL da imagem de capa
  link: string;            // Link da playlist
  description?: string;    // Descrição opcional
  createdAt: Date;         // Data de criação
  updatedAt: Date;         // Última atualização
  tags: PlaylistTag[];     // Tags associadas
}
```

### Tag
```typescript
{
  id: string;              // UUID da tag
  name: string;            // Nome da tag (1-50 chars)
  color?: string;          // Cor hexadecimal (opcional)
  createdAt: Date;         // Data de criação
  updatedAt: Date;         // Última atualização
  _count: {
    playlists: number;     // Número de playlists usando esta tag
  }
}
```

### PlaylistTag (Associação)
```typescript
{
  id: string;              // UUID da associação
  playlistId: string;      // ID da playlist
  tagId: string;           // ID da tag
  createdAt: Date;         // Data da associação
  tag: Tag;                // Dados da tag
}
```

### PlaylistListResponse
```typescript
{
  data: Playlist[];        // Lista de playlists
  pagination: {
    total: number;         // Total de playlists
    page: number;          // Página atual
    limit: number;         // Limite por página
    totalPages: number;    // Total de páginas
    next: boolean;         // Se existe próxima página
    prev: boolean;         // Se existe página anterior
  }
}
```

## Validação de Dados

O módulo utiliza **Zod** para validação robusta:

### Schemas de Validação

#### playlistSchema
```typescript
{
  name: string (min: 1),           // Nome obrigatório
  cover: string (URL válida),      // URL da capa
  link: string (URL válida),       // Link da playlist
  description?: string,            // Descrição opcional
  tags?: string[] (UUIDs)          // Array de IDs de tags
}
```

#### tagSchema
```typescript
{
  name: string (1-50 chars),       // Nome da tag
  color?: string (hex pattern)     // Cor hexadecimal (#RRGGBB)
}
```

#### playlistTagSchema
```typescript
{
  playlistId: string (UUID),       // ID da playlist
  tagId: string (UUID)             // ID da tag
}
```

### Regras de Validação
- Nome da playlist: mínimo 1 caractere
- Nome da tag: 1-50 caracteres
- URLs: formato válido obrigatório
- Cor: padrão hexadecimal (#RRGGBB)
- IDs: formato UUID válido
- Tags: array opcional de UUIDs

## Lógica de Negócio

### Handlers Principais

#### `createPlaylist`
- Valida dados de entrada com Zod
- Cria playlist no banco de dados
- Processa tags associadas em transação
- Verifica existência das tags antes da associação
- Retorna playlist com tags incluídas

#### `updatePlaylist`
- Verifica existência da playlist
- Atualiza dados básicos da playlist
- Remove todas as associações de tags existentes
- Recria associações com novas tags
- Mantém integridade referencial

#### `getPlaylists`
- Implementa paginação eficiente
- Suporte a filtro por tag específica
- Ordenação por data de criação (desc)
- Inclui tags associadas na resposta
- Retorna metadados de paginação

#### `getPlaylistsByTags`
- Filtra playlists por múltiplas tags
- Utiliza operador IN para eficiência
- Paginação com contadores precisos
- Ordenação consistente

#### `getAllTags`
- Lista todas as tags disponíveis
- Ordenação alfabética por nome
- Inclui contadores de uso
- Otimizado para performance

#### `createTag`
- Valida dados de entrada
- Converte nome para lowercase
- Cria tag no banco de dados
- Retorna tag criada

#### `updateTag` e `deleteTag`
- Operações CRUD básicas para tags
- Validação de existência
- Manutenção de integridade

## Controladores HTTP

O `PlaylistController.ts` implementa:
- Validação de entrada com Zod
- Tratamento de erros padronizado
- Respostas HTTP apropriadas
- Documentação Swagger detalhada
- Integração com handlers de negócio
- Parsing de parâmetros de query

## Configuração de Rotas

### PlaylistRouter (Público)
- Rotas de consulta e visualização
- Autenticação obrigatória para todas as rotas
- Acesso a playlists e tags
- Filtros e paginação

### AdminPlaylistRouter (Administrativo)
- Rotas de criação e modificação
- Autenticação + privilégios de admin
- Operações CRUD para playlists e tags
- Gestão completa do sistema

## Tratamento de Erros

### Códigos de Status
- `200`: Operação bem-sucedida
- `201`: Recurso criado
- `204`: Remoção bem-sucedida
- `400`: Dados inválidos ou parâmetros obrigatórios ausentes
- `401`: Não autenticado
- `403`: Sem privilégios administrativos
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### Tipos de Erro
- **Validação**: Dados inválidos ou malformados
- **Autorização**: Falta de privilégios
- **Não encontrado**: Playlist ou tag inexistente
- **Conflito**: Violação de integridade

## Dependências

### Principais
- **Express**: Framework web
- **Zod**: Validação de schemas
- **Prisma**: ORM para banco de dados
- **JWT**: Autenticação de usuários

### Middlewares
- `requireAuth`: Autenticação obrigatória
- `requireAdmin`: Privilégios administrativos
- Tratamento automático de erros Zod

## Segurança

### Autenticação e Autorização
- Todas as rotas exigem autenticação
- Rotas administrativas exigem privilégios especiais
- Verificação de tokens JWT
- Controle de acesso granular

### Validação de Dados
- Sanitização rigorosa de entrada
- Validação de tipos e formatos
- Prevenção de ataques de injeção
- Validação de URLs e padrões

### Proteção de Dados
- Transações para operações complexas
- Verificação de integridade referencial
- Logs de auditoria implícitos
- Prevenção de dados órfãos

## Integração com Outros Módulos

### Dependências
- **Auth**: Sistema de autenticação
- **Files**: Gestão de imagens de capa
- **Manga**: Possível integração com conteúdo

### Integrações Potenciais
- Sistema de recomendações
- Analytics de uso
- Cache de playlists populares
- Notificações de novos conteúdos

## Considerações de Performance

### Otimizações
- Paginação em todas as listagens
- Índices otimizados no banco
- Queries eficientes com includes
- Contadores paralelos

### Limitações
- Máximo 100 itens por página
- Transações para operações complexas
- Validação rigorosa de entrada

### Estratégias de Melhoria
- Cache Redis para tags populares
- Pré-computação de estatísticas
- Otimização de queries de associação
- Compressão de dados de resposta

## Próximas Melhorias

### Funcionalidades
- [ ] Sistema de favoritos de playlists
- [ ] Recomendações baseadas em tags
- [ ] Histórico de visualizações
- [ ] Compartilhamento social
- [ ] Templates de playlists

### Técnicas
- [ ] Cache distribuído para tags
- [ ] Busca full-text em playlists
- [ ] Processamento assíncrono
- [ ] Otimização de imagens

### Segurança
- [ ] Rate limiting por usuário
- [ ] Detecção de spam
- [ ] Auditoria completa
- [ ] Backup automático

## Testes

### Cenários de Teste
- Criação e edição de playlists
- Gestão de tags
- Associação playlist-tag
- Filtros e busca
- Paginação
- Tratamento de erros

### Testes de Integração
- Fluxo completo de gestão
- Integração com autenticação
- Transações de banco de dados
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
- Tags organizadas por funcionalidade (Playlists e Playlists - Admin)
- Documentação específica para sistema de tags

---

*Documentação gerada automaticamente para o módulo Playlists do S2Mangas*