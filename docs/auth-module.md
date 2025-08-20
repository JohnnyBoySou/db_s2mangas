# Módulo de Autenticação (Auth)

## Visão Geral

O módulo `auth` é responsável por toda a gestão de autenticação e autorização no sistema S2Mangás. Implementa um sistema robusto de autenticação baseado em JWT (JSON Web Tokens) com verificação de email, gestão de perfis de usuário e controle de acesso.

## Estrutura do Módulo

```
src/modules/auth/
├── __tests__/           # Testes unitários e de integração
│   ├── controller.test.ts
│   ├── handler.test.ts
│   └── router.test.ts
├── controllers/         # Controladores HTTP
│   └── AuthController.ts
├── handlers/           # Lógica de negócio
│   └── AuthHandler.ts
├── routes/             # Definição de rotas
│   └── AuthRouter.ts
└── validators/         # Schemas de validação
    └── AuthSchema.ts
```

## Funcionalidades Principais

### 1. Registro de Usuários
- **Endpoint**: `POST /auth/register`
- **Funcionalidade**: Criação de novas contas de usuário
- **Validação**: Email único, senha segura, dados obrigatórios
- **Processo**:
  1. Validação dos dados de entrada com Zod
  2. Verificação de email único no sistema
  3. Hash da senha com bcrypt
  4. Geração de código de verificação de email
  5. Envio de email de verificação
  6. Criação do usuário no banco de dados

### 2. Verificação de Email
- **Endpoint**: `POST /auth/verify-email`
- **Funcionalidade**: Confirmação de email através de código
- **Segurança**: Código temporário com expiração de 10 minutos
- **Processo**:
  1. Validação do código fornecido
  2. Verificação de expiração
  3. Ativação da conta do usuário

### 3. Login de Usuários
- **Endpoint**: `POST /auth/login`
- **Funcionalidade**: Autenticação e geração de token JWT
- **Validação**: Email verificado, credenciais válidas
- **Processo**:
  1. Verificação das credenciais
  2. Confirmação de email verificado
  3. Geração de token JWT com expiração de 15 dias
  4. Retorno do token e dados do usuário

### 4. Gestão de Perfil
- **Endpoints**:
  - `GET /auth/me` - Obter dados do perfil
  - `PATCH /auth/me` - Atualizar perfil
  - `DELETE /auth/me` - Excluir conta
- **Funcionalidades**:
  - Visualização de dados pessoais
  - Atualização de informações (nome, email, bio, avatar, etc.)
  - Exclusão segura da conta

## Schemas de Validação

### RegisterSchema
```typescript
{
  name: string (obrigatório),
  email: string (email válido, obrigatório),
  password: string (mínimo 6 caracteres, obrigatório)
}
```

### LoginSchema
```typescript
{
  email: string (email válido, obrigatório),
  password: string (obrigatório)
}
```

### UpdateUserSchema
```typescript
{
  name?: string,
  email?: string (email válido),
  username?: string,
  avatar?: string (URL),
  cover?: string (URL),
  bio?: string,
  birthdate?: Date
}
```

## Middlewares de Autenticação

### requireAuth
- **Localização**: `@/middlewares/auth`
- **Funcionalidade**: Verificação de token JWT válido
- **Uso**: Protege rotas que requerem autenticação
- **Processo**:
  1. Extração do token do header Authorization
  2. Verificação e decodificação do JWT
  3. Busca do usuário no banco de dados
  4. Anexação dos dados do usuário à requisição

### requireAdmin
- **Localização**: `@/middlewares/auth`
- **Funcionalidade**: Verificação de privilégios administrativos
- **Uso**: Protege rotas administrativas
- **Dependência**: Requer `requireAuth` previamente

## Segurança Implementada

### 1. Criptografia de Senhas
- **Biblioteca**: bcrypt
- **Salt Rounds**: Configurável via ambiente
- **Processo**: Hash irreversível das senhas antes do armazenamento

### 2. Tokens JWT
- **Algoritmo**: HS256
- **Expiração**: 15 dias
- **Secret**: Configurável via variável de ambiente `JWT_SECRET`
- **Payload**: Contém apenas o ID do usuário

### 3. Verificação de Email
- **Código**: 6 dígitos numéricos aleatórios
- **Expiração**: 10 minutos
- **Reenvio**: Automático em caso de login com email não verificado

### 4. Validação de Dados
- **Biblioteca**: Zod
- **Sanitização**: Automática através dos schemas
- **Tratamento de Erros**: Padronizado com `handleZodError`

## Integração com Email

### Configuração
- **Serviço**: Nodemailer
- **Templates**: HTML personalizados para verificação
- **Variáveis de Ambiente**:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`

### Templates de Email
1. **Verificação Inicial**: Enviado no registro
2. **Reenvio de Verificação**: Enviado em login com email não verificado

## Testes

### Cobertura de Testes
- **Controllers**: Testes de endpoints HTTP
- **Handlers**: Testes de lógica de negócio
- **Routers**: Testes de roteamento e middlewares

### Cenários Testados
- Registro com dados válidos e inválidos
- Login com credenciais corretas e incorretas
- Verificação de email com códigos válidos e expirados
- Atualização de perfil com dados válidos
- Exclusão de conta
- Middlewares de autenticação e autorização

## Tratamento de Erros

### Tipos de Erro
1. **Validação**: Dados inválidos (400)
2. **Autenticação**: Credenciais inválidas (401)
3. **Autorização**: Acesso negado (403)
4. **Conflito**: Email já cadastrado (409)
5. **Servidor**: Erros internos (500)

### Padronização
- Mensagens consistentes em português
- Códigos HTTP apropriados
- Logs detalhados para debugging

## Variáveis de Ambiente

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Dependências Principais

- **bcrypt**: Criptografia de senhas
- **jsonwebtoken**: Geração e verificação de JWT
- **zod**: Validação de schemas
- **nodemailer**: Envio de emails
- **prisma**: ORM para banco de dados

## Próximas Melhorias

1. **Autenticação Social**: Google OAuth (código comentado disponível)
2. **Recuperação de Senha**: Sistema de reset via email
3. **2FA**: Autenticação de dois fatores
4. **Rate Limiting**: Proteção contra ataques de força bruta
5. **Refresh Tokens**: Renovação automática de tokens
6. **Auditoria**: Log de ações de autenticação

## Uso em Outros Módulos

O módulo auth é fundamental para todo o sistema, sendo utilizado por:
- **Library**: Gestão de biblioteca pessoal
- **Collection**: Coleções de usuário
- **Analytics**: Métricas por usuário
- **Manga**: Operações administrativas
- **Discover**: Feed personalizado

Todos os módulos que requerem identificação de usuário dependem dos middlewares `requireAuth` e `requireAdmin` fornecidos por este módulo.