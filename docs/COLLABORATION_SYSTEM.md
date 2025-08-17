# Sistema de Colaboração em Collections

## Visão Geral

O sistema de colaboração permite que usuários adicionem outros usuários como colaboradores em suas collections, mesmo que sejam privadas. Isso permite que amigos trabalhem juntos na curadoria de mangás.

## Funcionalidades

### Papéis de Colaborador

- **EDITOR**: Pode adicionar/remover mangás da coleção
- **ADMIN**: Pode adicionar/remover mangás e gerenciar outros colaboradores
- **OWNER**: Dono da coleção com todas as permissões

### Permissões

| Ação | OWNER | ADMIN | EDITOR |
|------|-------|-------|--------|
| Visualizar coleção | ✅ | ✅ | ✅ |
| Adicionar/remover mangás | ✅ | ✅ | ✅ |
| Editar informações da coleção | ✅ | ✅ | ❌ |
| Adicionar colaboradores | ✅ | ✅ | ❌ |
| Remover colaboradores | ✅ | ✅ | ❌ |
| Atualizar papéis | ✅ | ✅ | ❌ |
| Deletar coleção | ✅ | ❌ | ❌ |

## Endpoints da API

### Adicionar Colaborador
```
POST /collections/{id}/collaborators
```

**Body:**
```json
{
  "userId": "uuid-do-usuario",
  "role": "EDITOR" // opcional, padrão: "EDITOR"
}
```

### Listar Colaboradores
```
GET /collections/{id}/collaborators
```

### Atualizar Papel do Colaborador
```
PUT /collections/{id}/collaborators/{userId}
```

**Body:**
```json
{
  "role": "ADMIN"
}
```

### Remover Colaborador
```
DELETE /collections/{id}/collaborators/{userId}
```

## Exemplos de Uso

### Adicionar um amigo como editor
```javascript
const response = await fetch('/collections/123/collaborators', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    userId: '456',
    role: 'EDITOR'
  })
});
```

### Promover colaborador para admin
```javascript
const response = await fetch('/collections/123/collaborators/456', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    role: 'ADMIN'
  })
});
```

## Comportamento das Collections

### Listagem de Collections
- O usuário agora vê suas próprias collections E as collections onde é colaborador
- Cada collection mostra informações do dono e do papel do usuário atual

### Verificação de Permissões
- Todas as operações de edição verificam se o usuário tem permissão
- Collections privadas só podem ser vistas por donos e colaboradores
- Collections públicas podem ser vistas por qualquer usuário

### Adição de Mangás
- Colaboradores podem adicionar/remover mangás mesmo em collections privadas
- O sistema verifica permissões antes de permitir qualquer modificação

## Estrutura do Banco de Dados

### Nova Tabela: CollectionCollaborator
```sql
CREATE TABLE "CollectionCollaborator" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "role" "CollaboratorRole" NOT NULL DEFAULT 'EDITOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CollectionCollaborator_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CollectionCollaborator_userId_collectionId_key" UNIQUE ("userId", "collectionId")
);
```

### Novo Enum: CollaboratorRole
```sql
CREATE TYPE "CollaboratorRole" AS ENUM ('EDITOR', 'ADMIN');
```

## Considerações de Segurança

1. **Validação de Permissões**: Todas as operações verificam permissões antes de executar
2. **Prevenção de Auto-Adição**: O dono da coleção não pode se adicionar como colaborador
3. **Verificação de Existência**: Sistema verifica se usuário e coleção existem
4. **Cascade Delete**: Quando uma coleção é deletada, todos os colaboradores são removidos automaticamente

## Migração

Para aplicar as mudanças no banco de dados:

```bash
npx prisma migrate dev --name add_collection_collaborators
```

## Testes

Execute os testes para verificar se tudo está funcionando:

```bash
npm test -- --testPathPattern=collection
```
