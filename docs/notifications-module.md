# Módulo Notifications

## Visão Geral

O módulo `notifications` é responsável pelo sistema de notificações da aplicação S2Mangas. Ele gerencia a criação, listagem, atualização e exclusão de notificações, fornecendo funcionalidades tanto para usuários quanto para administradores.

## Estrutura de Diretórios

```
src/modules/notifications/
├── controllers/
│   └── NotificationsController.ts    # Controladores HTTP para notificações
├── handlers/
│   └── NotificationsHandler.ts       # Lógica de negócio das notificações
├── routes/
│   └── NotificationsRouter.ts        # Configuração de rotas
└── validators/
    └── NotificationValidators.ts     # Schemas de validação com Zod
```

## Funcionalidades Principais

### 1. Gestão de Notificações
- **Criação de notificações**: Criação de notificações globais (admin)
- **Listagem de notificações**: Visualização paginada de notificações
- **Visualização individual**: Obtenção de notificação específica por ID
- **Atualização**: Atualização completa (PUT) e parcial (PATCH) de notificações
- **Exclusão**: Remoção de notificações do sistema

### 2. Tipos de Notificação
- **chapter_release**: Lançamento de novos capítulos
- **follow**: Notificações de seguimento entre usuários
- **system**: Notificações do sistema
- **custom**: Notificações personalizadas

### 3. Funcionalidades Especiais
- **Notificações de follow**: Sistema específico para notificar sobre novos seguidores
- **Dados customizados**: Suporte a dados JSON adicionais em cada notificação
- **Imagens de capa**: Suporte a URLs de imagens para notificações

## Endpoints da API

### Rotas de Usuário

#### GET /notifications
- **Descrição**: Lista notificações do usuário autenticado
- **Autenticação**: Requerida (JWT)
- **Parâmetros de Query**:
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (padrão: 20, máximo: 100)
- **Resposta**: Lista paginada de notificações

#### GET /notifications/:notificationId
- **Descrição**: Obtém uma notificação específica por ID
- **Autenticação**: Requerida (JWT)
- **Parâmetros**: `notificationId` (UUID)
- **Resposta**: Dados da notificação

### Rotas Administrativas

#### GET /admin/notifications
- **Descrição**: Lista todas as notificações (admin)
- **Autenticação**: Requerida (JWT + Admin)
- **Parâmetros de Query**: Mesmos da rota de usuário
- **Resposta**: Lista paginada de todas as notificações

#### POST /admin/notifications
- **Descrição**: Cria uma nova notificação
- **Autenticação**: Requerida (JWT + Admin)
- **Body**: Dados da notificação (title, message, type, cover opcional)
- **Resposta**: Notificação criada

#### PUT /admin/notifications/:notificationId
- **Descrição**: Atualização completa de notificação
- **Autenticação**: Requerida (JWT + Admin)
- **Body**: Todos os campos obrigatórios
- **Resposta**: Notificação atualizada

#### PATCH /admin/notifications/:notificationId
- **Descrição**: Atualização parcial de notificação
- **Autenticação**: Requerida (JWT + Admin)
- **Body**: Campos opcionais para atualização
- **Resposta**: Notificação atualizada

#### DELETE /admin/notifications/:notificationId
- **Descrição**: Remove uma notificação
- **Autenticação**: Requerida (JWT + Admin)
- **Resposta**: Status 204 (sem conteúdo)

## Schemas de Dados

### Notification
```typescript
{
  id: string;           // UUID único
  title: string;        // Título da notificação
  message: string;      // Mensagem da notificação
  type: string;         // Tipo da notificação
  cover?: string;       // URL da imagem de capa (opcional)
  data?: object;        // Dados adicionais em JSON (opcional)
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data da última atualização
}
```

### NotificationCreate
```typescript
{
  title: string;        // 1-100 caracteres
  message: string;      // 1-500 caracteres
  type: string;         // Tipo da notificação
  cover?: string;       // URL válida (opcional)
}
```

### NotificationListResponse
```typescript
{
  notifications: Notification[];
  total: number;        // Total de notificações
  totalPages: number;   // Total de páginas
  currentPage: number;  // Página atual
}
```

## Validação de Dados

### Schemas de Validação (Zod)

#### createNotificationSchema
- `title`: String obrigatória (1-100 caracteres)
- `message`: String obrigatória (1-500 caracteres)
- `type`: String obrigatória
- `cover`: URL opcional

#### updateNotificationSchema
- Mesmos campos do `createNotificationSchema`
- Todos os campos obrigatórios para atualização completa

#### patchNotificationSchema
- Mesmos campos do `createNotificationSchema`
- Todos os campos opcionais
- Validação para garantir pelo menos um campo

## Lógica de Negócio

### Handlers Principais

#### createNotification
- Cria notificação global no sistema
- Suporte a dados JSON customizados
- Validação de entrada via Zod

#### createUserNotification
- Função genérica para criação de notificações
- Utilizada internamente por outras funções

#### createFollowNotification
- Cria notificação específica para novos seguidores
- Inclui dados do seguidor e usuário alvo
- Tipo automático: 'follow'

#### listNotifications
- Lista notificações com paginação
- Suporte a filtros e ordenação
- Retorna metadados de paginação

#### updateNotification (PUT)
- Atualização completa de notificação
- Todos os campos obrigatórios
- Validação de existência

#### patchNotification (PATCH)
- Atualização parcial de notificação
- Campos opcionais
- Remove campos undefined

#### getNotification
- Busca notificação por ID
- Validação de existência
- Retorna erro 404 se não encontrada

#### deleteNotification
- Remove notificação do banco de dados
- Operação irreversível

## Controladores HTTP

### NotificationsController
- **listAllNotifications**: Lista notificações com paginação
- **createNotification**: Cria nova notificação (admin)
- **getNotification**: Obtém notificação por ID
- **updateNotification**: Atualização completa (admin)
- **patchNotification**: Atualização parcial (admin)
- **deleteNotification**: Remove notificação (admin)

## Configuração de Rotas

### NotificationsRouter (Usuário)
- `GET /`: Lista notificações do usuário
- `GET /:notificationId`: Obtém notificação específica
- **Middleware**: `requireAuth`

### AdminNotificationsRouter (Admin)
- `GET /`: Lista todas as notificações
- `POST /`: Cria nova notificação
- `PUT /:notificationId`: Atualização completa
- `PATCH /:notificationId`: Atualização parcial
- `DELETE /:notificationId`: Remove notificação
- **Middlewares**: `requireAuth` + `requireAdmin`

## Tratamento de Erros

### Tipos de Erro
- **400 Bad Request**: Dados de entrada inválidos
- **401 Unauthorized**: Token de autenticação inválido
- **403 Forbidden**: Acesso negado (não admin)
- **404 Not Found**: Notificação não encontrada
- **500 Internal Server Error**: Erro interno do servidor

### Códigos de Status
- **200**: Operação bem-sucedida
- **201**: Notificação criada
- **204**: Notificação deletada
- **400**: Erro de validação
- **404**: Recurso não encontrado

## Dependências

### Principais
- **@prisma/client**: ORM para banco de dados
- **express**: Framework web
- **zod**: Validação de schemas

### Utilitários
- **@/utils/zodError**: Tratamento de erros Zod
- **@/utils/pagination**: Utilitários de paginação
- **@/middlewares/auth**: Middlewares de autenticação

## Segurança

### Autenticação
- Todas as rotas protegidas por JWT
- Rotas administrativas requerem privilégios especiais
- Validação de tokens em cada requisição

### Validação de Dados
- Schemas Zod para validação rigorosa
- Sanitização de entrada
- Limites de tamanho para campos de texto

### Proteção de Dados
- Validação de URLs para imagens
- Prevenção de injeção de dados maliciosos
- Controle de acesso baseado em roles

## Integração com Outros Módulos

### Módulo Auth
- Utiliza middlewares de autenticação
- Validação de tokens JWT
- Controle de acesso administrativo

### Módulo Users
- Notificações de follow entre usuários
- Dados de usuário em notificações

### Sistema de Mangás
- Notificações de novos capítulos
- Integração com releases

## Considerações de Performance

### Otimizações Implementadas
- Paginação para grandes volumes de dados
- Índices no banco de dados
- Validação eficiente com Zod

### Limitações Atuais
- Sem cache de notificações
- Sem notificações em tempo real
- Sem sistema de preferências de usuário

### Estratégias de Melhoria
- Implementar cache Redis
- WebSockets para notificações em tempo real
- Sistema de preferências de notificação
- Compressão de dados JSON

## Próximas Melhorias

### Funcionalidades
- [ ] Notificações em tempo real (WebSockets)
- [ ] Sistema de preferências de usuário
- [ ] Notificações push para mobile
- [ ] Templates de notificação
- [ ] Agendamento de notificações
- [ ] Notificações por email
- [ ] Sistema de categorias
- [ ] Notificações de grupo

### Técnicas
- [ ] Cache inteligente com Redis
- [ ] Otimização de queries
- [ ] Compressão de dados
- [ ] Métricas de entrega
- [ ] Sistema de retry
- [ ] Rate limiting
- [ ] Monitoramento de performance

### Segurança
- [ ] Criptografia de dados sensíveis
- [ ] Auditoria de notificações
- [ ] Prevenção de spam
- [ ] Validação avançada de conteúdo
- [ ] Sistema de moderação

## Testes

### Cenários de Teste
- Criação de notificações
- Listagem com paginação
- Atualização completa e parcial
- Exclusão de notificações
- Validação de dados
- Autenticação e autorização
- Tratamento de erros

### Integração
- Testes de API endpoints
- Validação de middlewares
- Testes de banco de dados
- Cenários de erro

### Cobertura
- Controllers: Validação de entrada e saída
- Handlers: Lógica de negócio
- Validators: Schemas Zod
- Routes: Configuração de endpoints

## Documentação Swagger

O módulo possui documentação completa no Swagger com:
- Schemas detalhados de todas as entidades
- Exemplos de requisições e respostas
- Códigos de status e mensagens de erro
- Parâmetros de entrada e validações
- Tags organizadas por funcionalidade

### Tags Swagger
- **Notificações**: Endpoints de usuário
- **Notificações - Admin**: Endpoints administrativos

---

*Documentação gerada automaticamente para o módulo notifications do S2Mangas*