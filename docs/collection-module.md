# Módulo Collection

## Visão Geral

O módulo **Collection** é responsável pela gestão de coleções de mangás no sistema S2Mangas. Este módulo permite que usuários criem, organizem e compartilhem coleções personalizadas de mangás, incluindo funcionalidades avançadas de colaboração, sistema de curtidas e controle de visibilidade.

## Estrutura do Diretório

```
src/modules/collection/
├── controllers/
│   ├── CollectionController.ts     # Controladores HTTP para coleções
│   └── CollaboratorController.ts   # Controladores para colaboração
├── handlers/
│   ├── CollectionHandler.ts        # Lógica de negócio para coleções
│   └── CollaboratorHandler.ts      # Lógica de colaboração
├── routes/
│   └── CollectionRouter.ts         # Definição das rotas
├── validators/
│   ├── CollectionValidator.ts      # Schemas de validação para coleções
│   └── CollaboratorValidator.ts    # Schemas de validação para colaboração
├── middlewares/
│   └── collaboratorAuth.ts         # Middlewares de autorização
└── __tests__/
    └── *.test.ts                   # Testes unitários
```

## Funcionalidades Principais

### 1. Gestão de Coleções
- **Criação de coleções** com nome, capa, descrição e status de visibilidade
- **Listagem paginada** das coleções do usuário e onde é colaborador
- **Visualização detalhada** com mangás, colaboradores e estatísticas
- **Atualização** de informações da coleção
- **Exclusão** com verificação de permissões
- **Coleções públicas** visíveis para todos os usuários

### 2. Sistema de Colaboração
- **Papéis de colaborador**: EDITOR, ADMIN e OWNER
- **Permissões granulares** para diferentes ações
- **Gestão de colaboradores** (adicionar, remover, atualizar papéis)
- **Controle de acesso** a coleções privadas
- **Verificação de permissões** em tempo real

### 3. Gestão de Mangás
- **Adicionar/remover mangás** das coleções
- **Toggle de mangás** (adicionar se não existe, remover se existe)
- **Verificação de mangás** em coleções do usuário
- **Rastreamento** de quem adicionou cada mangá
- **Contagem** automática de mangás por coleção

### 4. Sistema de Curtidas
- **Curtir/descurtir** coleções
- **Contagem** de curtidas por coleção
- **Rastreamento** de curtidas por usuário
- **Estatísticas** de popularidade

## Schemas de Validação

### CollectionValidator.ts
```typescript
// Criação de coleção
createcollectionSchema = {
  name: string (min: 1),
  cover: string (URL),
  description?: string,
  status?: 'PRIVATE' | 'PUBLIC',
  mangaIds?: string[] (UUIDs)
}

// Atualização de coleção
updateCollectionSchema = {
  id: string (UUID),
  name?: string (min: 1),
  cover?: string (URL),
  description?: string,
  status?: 'PRIVATE' | 'PUBLIC'
}

// ID da coleção
collectionIdSchema = {
  id: string (UUID)
}
```

### CollaboratorValidator.ts
```typescript
// Adicionar colaborador
addCollaboratorSchema = {
  collectionId: string (UUID),
  userId: string (UUID),
  role: 'EDITOR' | 'ADMIN' (default: 'EDITOR')
}

// Atualizar papel do colaborador
updateCollaboratorRoleSchema = {
  collectionId: string (UUID),
  userId: string (UUID),
  role: 'EDITOR' | 'ADMIN'
}

// Remover colaborador
removeCollaboratorSchema = {
  collectionId: string (UUID),
  userId: string (UUID)
}
```

## Rotas da API

### Rotas de Coleções
- `POST /collections` - Criar nova coleção
- `GET /collections` - Listar coleções do usuário
- `GET /collections/public` - Listar coleções públicas
- `GET /collections/:id` - Obter coleção por ID
- `PUT /collections/:id` - Atualizar coleção
- `DELETE /collections/:id` - Deletar coleção
- `GET /collections/check/:mangaId` - Verificar mangá em coleções
- `POST /collections/:id/toggle/:mangaId` - Alternar mangá na coleção

### Rotas de Colaboração
- `POST /collections/:id/collaborators` - Adicionar colaborador
- `GET /collections/:id/collaborators` - Listar colaboradores
- `PUT /collections/:id/collaborators/:userId` - Atualizar papel do colaborador
- `DELETE /collections/:id/collaborators/:userId` - Remover colaborador

## Middlewares

### Autenticação
- `requireAuth` - Verificação de autenticação JWT

### Autorização de Colaboração
- `requireCollectionOwner` - Apenas dono pode executar
- `requireCollectionAdmin` - Dono ou admin podem executar
- `requireCollectionEditor` - Qualquer pessoa com permissão pode executar

## Sistema de Permissões

### Papéis e Permissões

| Ação | OWNER | ADMIN | EDITOR |
|------|-------|-------|---------|
| Visualizar coleção | ✅ | ✅ | ✅ |
| Adicionar/remover mangás | ✅ | ✅ | ✅ |
| Editar informações da coleção | ✅ | ✅ | ❌ |
| Adicionar colaboradores | ✅ | ✅ | ❌ |
| Remover colaboradores | ✅ | ✅ | ❌ |
| Atualizar papéis | ✅ | ✅ | ❌ |
| Deletar coleção | ✅ | ❌ | ❌ |

### Verificação de Permissões
- **Coleções públicas**: Qualquer usuário pode visualizar
- **Coleções privadas**: Apenas dono e colaboradores
- **Operações de edição**: Verificação de papel do usuário
- **Proteção contra auto-adição**: Dono não pode ser colaborador

## Funcionalidades Avançadas

### 1. Sistema de Colaboração
- **Trabalho em equipe** em coleções privadas
- **Controle granular** de permissões
- **Gestão flexível** de colaboradores
- **Segurança** contra ações não autorizadas

### 2. Gestão de Visibilidade
- **Coleções privadas**: Visíveis apenas para dono e colaboradores
- **Coleções públicas**: Visíveis para todos os usuários
- **Controle dinâmico** de status de visibilidade

### 3. Performance e Otimização
- **Paginação** em todas as listagens
- **Contadores otimizados** com `_count`
- **Queries eficientes** com includes seletivos
- **Verificações de permissão** em tempo real

### 4. Rastreamento e Auditoria
- **Registro** de quem adicionou cada mangá
- **Timestamps** de criação e atualização
- **Histórico** de colaboradores
- **Estatísticas** de uso e popularidade

## Tratamento de Erros

### Erros Comuns
- **404**: Coleção não encontrada
- **403**: Sem permissão para a ação
- **400**: Dados de entrada inválidos
- **401**: Usuário não autenticado
- **409**: Conflito (ex: colaborador já existe)

### Validação de Dados
- **Zod schemas** para validação de entrada
- **Verificação de UUIDs** para IDs
- **Validação de URLs** para capas
- **Verificação de existência** de usuários e mangás

## Dependências

### Principais
- **@prisma/client**: ORM para banco de dados
- **zod**: Validação de schemas
- **express**: Framework web
- **jsonwebtoken**: Autenticação JWT

### Internas
- **@/middlewares/auth**: Middleware de autenticação
- **@/utils/pagination**: Utilitários de paginação
- **@/utils/zodError**: Tratamento de erros Zod

## Testes

### Cobertura de Testes
- **Handlers**: Lógica de negócio completa
- **Controllers**: Endpoints da API
- **Middlewares**: Verificação de permissões
- **Validadores**: Schemas de validação
- **Casos de erro**: Cenários de falha

### Cenários Testados
- Criação e gestão de coleções
- Sistema de colaboração
- Verificação de permissões
- Operações com mangás
- Casos de erro e validação

## Próximas Melhorias

### Funcionalidades Planejadas
1. **Sistema de notificações** para colaboradores
2. **Histórico de atividades** nas coleções
3. **Templates de coleções** pré-definidos
4. **Importação/exportação** de coleções
5. **Sistema de tags** para categorização
6. **Comentários** em coleções
7. **Recomendações** baseadas em coleções

### Otimizações
1. **Cache** de coleções populares
2. **Índices** otimizados no banco
3. **Lazy loading** de mangás
4. **Compressão** de imagens de capa

## Integração com Outros Módulos

### Dependências
- **Auth**: Sistema de autenticação e autorização
- **Manga**: Dados dos mangás nas coleções
- **User**: Informações dos usuários e colaboradores
- **Profile**: Exibição de coleções no perfil

### Integrações
- **Library**: Sincronização com biblioteca pessoal
- **Discover**: Recomendações baseadas em coleções
- **Analytics**: Métricas de uso e popularidade
- **Search**: Busca em coleções públicas

## Considerações de Segurança

### Proteções Implementadas
- **Verificação de propriedade** antes de operações
- **Validação de permissões** em tempo real
- **Sanitização** de dados de entrada
- **Prevenção** de ataques de injeção
- **Rate limiting** implícito via autenticação

### Boas Práticas
- **Princípio do menor privilégio** nas permissões
- **Validação dupla** (frontend + backend)
- **Logs** de ações sensíveis
- **Criptografia** de dados sensíveis

## Como Usar

### Exemplo: Criar uma Coleção
```javascript
POST /collections
{
  "name": "Meus Mangás Favoritos",
  "cover": "https://example.com/cover.jpg",
  "description": "Uma coleção dos meus mangás favoritos",
  "status": "PUBLIC",
  "mangaIds": ["uuid1", "uuid2"]
}
```

### Exemplo: Adicionar Colaborador
```javascript
POST /collections/{id}/collaborators
{
  "userId": "uuid-do-usuario",
  "role": "EDITOR"
}
```

### Exemplo: Toggle Mangá
```javascript
POST /collections/{id}/toggle/{mangaId}
// Retorna: { "added": true, "message": "Mangá adicionado à coleção" }
```

O módulo Collection oferece uma solução completa para gestão colaborativa de coleções de mangás, com foco em usabilidade, segurança e performance.