# Módulo Profile

## Visão Geral

O módulo **Profile** é responsável pela gestão de perfis de usuários na plataforma S2Mangas. Ele oferece funcionalidades completas para visualização, busca, interação social (curtir/seguir) e descoberta de perfis similares, proporcionando uma experiência social rica para os usuários.

## Estrutura de Diretórios

```
src/modules/profile/
├── controllers/
│   └── ProfileController.ts    # Controladores HTTP e documentação Swagger
├── handlers/
│   └── ProfileHandler.ts       # Lógica de negócio
├── routes/
│   └── ProfileRouter.ts        # Configuração de rotas
└── validators/                 # Diretório para validadores (vazio)
```

## Funcionalidades Principais

### 1. Gestão de Perfis
- **Visualização de perfis**: Exibição completa de dados do usuário
- **Listagem de perfis**: Paginação de todos os perfis da plataforma
- **Busca de perfis**: Pesquisa por nome ou username
- **Perfis similares**: Descoberta baseada em interesses

### 2. Interações Sociais
- **Sistema de curtidas**: Curtir/descurtir perfis
- **Sistema de seguimento**: Seguir/deixar de seguir usuários
- **Seguidores e seguindo**: Listagem de conexões sociais

### 3. Estatísticas e Coleções
- **Estatísticas do perfil**: Contadores de atividades
- **Coleções públicas**: Exibição de coleções do usuário
- **Status de interação**: Verificação de curtidas e seguimento

## Endpoints da API

### Rotas de Usuário

#### `GET /profiles`
- **Descrição**: Lista todos os perfis com paginação
- **Autenticação**: Obrigatória
- **Parâmetros de Query**:
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (máximo: 50, padrão: 10)
- **Resposta**: Lista paginada de perfis

#### `GET /profiles/search`
- **Descrição**: Busca perfis por nome ou username
- **Autenticação**: Obrigatória
- **Parâmetros de Query**:
  - `q` (obrigatório): Termo de busca (1-100 caracteres)
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (máximo: 50, padrão: 10)
- **Resposta**: Lista de perfis encontrados

#### `GET /profiles/:username`
- **Descrição**: Obtém dados completos de um perfil específico
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `username`: Nome de usuário do perfil
- **Resposta**: Dados completos do perfil

#### `GET /profiles/:userId/similar`
- **Descrição**: Encontra perfis similares baseados em interesses
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `userId`: ID do usuário (UUID)
- **Parâmetros de Query**:
  - `limit` (opcional): Número de perfis (máximo: 20, padrão: 10)
- **Resposta**: Lista de perfis similares

#### `GET /profiles/:userId/followers`
- **Descrição**: Lista os seguidores de um usuário
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `userId`: ID do usuário (UUID)
- **Parâmetros de Query**:
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (máximo: 50, padrão: 10)
- **Resposta**: Lista paginada de seguidores

#### `GET /profiles/:userId/following`
- **Descrição**: Lista os usuários que um perfil está seguindo
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `userId`: ID do usuário (UUID)
- **Parâmetros de Query**:
  - `page` (opcional): Número da página (padrão: 1)
  - `limit` (opcional): Itens por página (máximo: 50, padrão: 10)
- **Resposta**: Lista paginada de usuários seguindo

#### `POST /profiles/:username/like`
- **Descrição**: Alterna o status de curtida de um perfil
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `username`: Nome de usuário do perfil
- **Resposta**: Status da ação (liked/unliked)

#### `POST /profiles/:username/follow`
- **Descrição**: Alterna o status de seguimento de um perfil
- **Autenticação**: Obrigatória
- **Parâmetros de Rota**:
  - `username`: Nome de usuário do perfil
- **Resposta**: Status da ação (followed/unfollowed)

## Schemas de Dados

### Profile
```typescript
{
  id: string;              // UUID do usuário
  name: string;            // Nome completo
  username: string;        // Nome de usuário único
  avatar?: string;         // URL do avatar
  cover?: string;          // URL da capa do perfil
  bio?: string;            // Biografia
  createdAt: Date;         // Data de criação
  isFollowing: boolean;    // Se o usuário autenticado segue
  isLiked: boolean;        // Se o usuário autenticado curtiu
  collections: ProfileCollection[]; // Coleções públicas
  stats: {
    libraryEntries: number; // Mangás na biblioteca
    likes: number;          // Curtidas recebidas
    comments: number;       // Comentários feitos
    followers: number;      // Número de seguidores
    following: number;      // Número seguindo
  }
}
```

### ProfileCollection
```typescript
{
  id: string;              // UUID da coleção
  name: string;            // Nome da coleção
  cover?: string;          // URL da capa
  description?: string;    // Descrição
  createdAt: Date;         // Data de criação
  updatedAt: Date;         // Última atualização
  stats: {
    likes: number;         // Curtidas da coleção
    mangas: number;        // Mangás na coleção
  }
}
```

### ToggleResponse
```typescript
{
  action: 'liked' | 'unliked' | 'followed' | 'unfollowed';
  message: string;         // Mensagem de confirmação
}
```

## Validação de Dados

O módulo utiliza **Zod** para validação de entrada:

### Schemas de Validação
- **searchProfilesSchema**: Validação para busca de perfis
- **similarProfilesSchema**: Validação para perfis similares
- **followersSchema**: Validação para listagem de seguidores
- **followingSchema**: Validação para listagem de seguindo

### Regras de Validação
- Query de busca: 1-100 caracteres
- Paginação: página mínima 1, limite máximo 50
- IDs de usuário: formato UUID válido
- Limite de perfis similares: máximo 20

## Lógica de Negócio

### Handlers Principais

#### `getProfileData`
- Busca dados completos do perfil
- Inclui coleções públicas e estatísticas
- Verifica status de seguimento e curtida
- Calcula contadores de atividades

#### `searchProfiles`
- Busca perfis por nome ou username
- Implementa paginação
- Ordena por relevância e popularidade
- Inclui status de interação para cada perfil

#### `getSimilarProfiles`
- Encontra perfis com interesses similares
- Baseado em atividades e preferências
- Exclui o próprio usuário dos resultados
- Limita resultados para performance

#### `getFollowers` / `getFollowing`
- Lista conexões sociais com paginação
- Inclui dados básicos dos perfis
- Verifica status de seguimento mútuo

#### `toggleFollowProfile`
- Alterna status de seguimento
- Cria/remove relacionamento no banco
- Atualiza contadores de seguidores
- Retorna ação realizada

## Controladores HTTP

O `ProfileController.ts` implementa:
- Validação de entrada usando Zod
- Tratamento de erros padronizado
- Respostas HTTP apropriadas
- Documentação Swagger completa
- Integração com handlers de negócio

## Configuração de Rotas

O `ProfileRouter.ts` define:
- Rotas RESTful para perfis
- Middleware de autenticação obrigatório
- Parâmetros de rota e query
- Integração com controladores

## Tratamento de Erros

### Tipos de Erro
- **400 Bad Request**: Dados de entrada inválidos
- **401 Unauthorized**: Autenticação necessária
- **404 Not Found**: Perfil/usuário não encontrado
- **500 Internal Server Error**: Erros do servidor

### Códigos de Status
- `200`: Operação bem-sucedida
- `400`: Erro de validação
- `401`: Não autenticado
- `404`: Recurso não encontrado
- `500`: Erro interno

## Dependências

### Principais
- **Express**: Framework web
- **Zod**: Validação de schemas
- **Prisma**: ORM para banco de dados
- **JWT**: Autenticação de usuários

### Middlewares
- `requireAuth`: Autenticação obrigatória
- Validação de entrada
- Tratamento de erros

## Segurança

### Autenticação
- Todas as rotas exigem autenticação
- Verificação de token JWT
- Identificação do usuário autenticado

### Validação de Dados
- Sanitização de entrada
- Validação de tipos e formatos
- Prevenção de ataques de injeção

### Proteção de Dados
- Exposição apenas de dados públicos
- Verificação de permissões
- Filtragem de informações sensíveis

## Integração com Outros Módulos

### Dependências
- **Auth**: Sistema de autenticação
- **Users**: Dados básicos de usuários
- **Collections**: Coleções públicas
- **Library**: Estatísticas de biblioteca

### Integrações
- Sistema de notificações para seguimento
- Cache de dados de perfil
- Análise de comportamento do usuário

## Considerações de Performance

### Otimizações
- Paginação em todas as listagens
- Índices no banco de dados
- Cache de dados frequentes
- Limitação de resultados

### Limitações
- Máximo 50 itens por página
- Máximo 20 perfis similares
- Timeout em buscas complexas

### Estratégias de Melhoria
- Cache Redis para perfis populares
- Pré-computação de perfis similares
- Otimização de queries do banco
- Compressão de respostas

## Próximas Melhorias

### Funcionalidades
- [ ] Sistema de bloqueio de usuários
- [ ] Perfis privados/públicos
- [ ] Recomendações personalizadas
- [ ] Histórico de atividades
- [ ] Badges e conquistas

### Técnicas
- [ ] Cache distribuído
- [ ] Busca com Elasticsearch
- [ ] Análise de sentimento
- [ ] Machine Learning para recomendações

### Segurança
- [ ] Rate limiting por usuário
- [ ] Detecção de spam
- [ ] Auditoria de ações
- [ ] Criptografia de dados sensíveis

## Testes

### Cenários de Teste
- Busca de perfis com diferentes termos
- Paginação e limites
- Interações sociais (curtir/seguir)
- Perfis similares e recomendações
- Tratamento de erros e casos extremos

### Testes de Integração
- Fluxo completo de interação social
- Integração com sistema de autenticação
- Sincronização com outros módulos

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
- Informações de autenticação

---

*Documentação gerada automaticamente para o módulo Profile do S2Mangas*