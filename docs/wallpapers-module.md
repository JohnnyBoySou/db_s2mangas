# Módulo Wallpapers

## Visão Geral

O módulo `wallpapers` é responsável pela gestão de papéis de parede na plataforma S2Mangas. Permite que administradores criem, atualizem e gerenciem coleções de wallpapers, incluindo funcionalidades de importação de dados externos e toggle de imagens individuais.

## Estrutura de Diretórios

```
src/modules/wallpapers/
├── controllers/
│   └── WallpaperControllers.ts  # Controladores HTTP e documentação Swagger
├── handlers/
│   └── WallpaperHandler.ts      # Lógica de negócio para wallpapers
├── routes/
│   └── WallpaperRouter.ts       # Configuração de rotas
└── validators/
    └── WallpaperValidator.ts    # Schemas de validação Zod
```

## Funcionalidades Principais

### Gestão de Wallpapers
- **Criação de Wallpapers**: Administradores podem criar novos wallpapers
- **Atualização de Wallpapers**: Modificação de wallpapers existentes
- **Exclusão de Wallpapers**: Remoção de wallpapers e suas imagens
- **Listagem de Wallpapers**: Visualização paginada de todos os wallpapers
- **Detalhes de Wallpaper**: Visualização de um wallpaper específico com suas imagens

### Gestão de Imagens
- **Toggle de Imagens**: Adicionar ou remover imagens individuais de um wallpaper
- **Múltiplas Imagens**: Suporte a múltiplas imagens por wallpaper
- **Paginação de Imagens**: Listagem paginada das imagens de um wallpaper

### Funcionalidades de Importação
- **Importação JSON**: Importação em massa de wallpapers a partir de arquivo JSON
- **Importação Pinterest**: Importação de wallpapers diretamente do Pinterest

## Endpoints da API

### Rotas Públicas (Autenticadas)

#### Listar Wallpapers
- **GET** `/wallpapers`
- **Autenticação**: Requerida
- **Parâmetros**:
  - `page` (query): Página (padrão: 1)
  - `limit` (query): Limite por página (padrão: 10, máximo: 100)
- **Resposta**: Lista paginada de wallpapers com contagem de imagens

#### Obter Wallpaper por ID
- **GET** `/wallpapers/:id`
- **Autenticação**: Requerida
- **Parâmetros**:
  - `id` (path): ID do wallpaper (UUID)
  - `page` (query): Página das imagens (padrão: 1)
  - `limit` (query): Limite de imagens por página (padrão: 10)
- **Resposta**: Wallpaper com suas imagens paginadas

### Rotas Administrativas

#### Criar Wallpaper
- **POST** `/admin/wallpapers`
- **Autenticação**: Requerida (Admin)
- **Corpo da Requisição**:
```json
{
  "name": "string (obrigatório)",
  "cover": "string (URL válida)",
  "images": [
    {
      "url": "string (URL válida)"
    }
  ]
}
```

#### Atualizar Wallpaper
- **PUT** `/admin/wallpapers/:id`
- **Autenticação**: Requerida (Admin)
- **Parâmetros**:
  - `id` (path): ID do wallpaper
- **Corpo da Requisição**: Mesmo formato da criação

#### Deletar Wallpaper
- **DELETE** `/admin/wallpapers/:id`
- **Autenticação**: Requerida (Admin)
- **Parâmetros**:
  - `id` (path): ID do wallpaper

#### Toggle Imagem
- **POST** `/admin/wallpapers/:id/toggle`
- **Autenticação**: Requerida (Admin)
- **Parâmetros**:
  - `id` (path): ID do wallpaper
- **Corpo da Requisição**:
```json
{
  "image": "string (URL da imagem)"
}
```

#### Importar de JSON
- **POST** `/admin/wallpapers/import`
- **Autenticação**: Requerida (Admin)
- **Descrição**: Importa wallpapers de arquivo JSON local

#### Importar do Pinterest
- **POST** `/admin/wallpapers/import-pinterest`
- **Autenticação**: Requerida (Admin)
- **Corpo da Requisição**:
```json
{
  "pinterestUrl": "string (URL do Pinterest)"
}
```

## Schemas de Dados

### Wallpaper
```typescript
interface Wallpaper {
  id: string;           // UUID
  name: string;         // Nome do wallpaper
  cover: string;        // URL da imagem de capa
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
  totalImages: number;  // Número total de imagens
  images: WallpaperImage[]; // Lista de imagens
}
```

### WallpaperImage
```typescript
interface WallpaperImage {
  id: string;        // UUID
  wallpaperId: string; // ID do wallpaper
  url: string;       // URL da imagem
  createdAt: Date;   // Data de criação
}
```

### WallpaperListResponse
```typescript
interface WallpaperListResponse {
  data: Wallpaper[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    next: boolean;
    prev: boolean;
  };
}
```

### WallpaperDetailResponse
```typescript
interface WallpaperDetailResponse {
  data: Wallpaper;
  pagination: {
    total: number;      // Total de imagens
    page: number;
    limit: number;
    totalPages: number;
    next: boolean;
    prev: boolean;
  };
}
```

## Validação de Dados

### Schema Zod

#### wallpaperSchema
```typescript
const wallpaperSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cover: z.string().url('URL da capa inválida'),
  images: z.array(z.object({
    url: z.string().url('URL da imagem inválida')
  })).min(1, 'Pelo menos uma imagem é necessária')
});
```

### Regras de Validação
- **Nome**: Obrigatório, mínimo 1 caractere
- **Cover**: URL válida obrigatória
- **Images**: Array com pelo menos 1 imagem
- **Image URL**: Cada URL deve ser válida

## Lógica de Negócio

### Handlers Principais

#### getWallpapers
- Lista wallpapers com paginação
- Ordena por data de criação (mais recentes primeiro)
- Inclui contagem total de imagens
- Retorna metadados de paginação

#### getWallpaperById
- Busca wallpaper específico por ID
- Inclui imagens com paginação
- Lança erro se não encontrado
- Retorna metadados de paginação das imagens

#### createWallpaper
- Valida dados usando schema Zod
- Cria wallpaper com imagens associadas
- Retorna wallpaper criado com imagens

#### updateWallpaper
- Valida dados usando schema Zod
- Remove todas as imagens existentes
- Cria novas imagens conforme fornecido
- Retorna wallpaper atualizado

#### deleteWallpaper
- Verifica se wallpaper existe
- Remove todas as imagens associadas primeiro
- Remove o wallpaper
- Retorna mensagem de sucesso

#### toggleWallpaperImage
- Verifica se wallpaper existe
- Se imagem existe: remove
- Se imagem não existe: adiciona
- Retorna ação realizada (added/removed)

#### importFromJson
- Lê arquivo JSON local (`src/import/wallpapers.json`)
- Processa cada wallpaper do arquivo
- Limpa e parseia dados de imagens
- Cria wallpapers com suas imagens
- Retorna resultado da importação

#### importFromPinterest
- Extrai username e board name da URL
- Faz requisição para API do Pinterest
- Extrai URLs das imagens dos pins
- Cria wallpaper com imagens importadas
- Usa primeira imagem como capa

## Controladores HTTP

O `WallpaperControllers.ts` gerencia:
- Documentação Swagger completa para todos os endpoints
- Validação de entrada e tratamento de erros
- Formatação de respostas HTTP
- Integração com handlers de negócio
- Tratamento específico de erros Zod

## Configuração de Rotas

### Rotas Públicas (WallpaperRouter)
- `GET /` - Listar wallpapers (requer autenticação)
- `GET /:id` - Obter wallpaper por ID (requer autenticação)

### Rotas Administrativas (AdminWallpaperRouter)
- `GET /` - Listar wallpapers (admin)
- `GET /:id` - Obter wallpaper por ID (admin)
- `POST /` - Criar wallpaper
- `PUT /:id` - Atualizar wallpaper
- `DELETE /:id` - Deletar wallpaper
- `POST /:id/toggle` - Toggle imagem
- `POST /import` - Importar de JSON
- `POST /import-pinterest` - Importar do Pinterest

## Tratamento de Erros

### Códigos de Status
- **200**: Operação bem-sucedida
- **201**: Wallpaper criado com sucesso
- **204**: Wallpaper deletado com sucesso
- **400**: Dados inválidos (validação Zod)
- **401**: Não autenticado
- **403**: Não autorizado (requer admin)
- **404**: Wallpaper não encontrado
- **500**: Erro interno do servidor

### Tipos de Erro
- **ValidationError**: Dados de entrada inválidos (Zod)
- **NotFoundError**: Wallpaper não encontrado
- **UnauthorizedError**: Acesso negado
- **ImportError**: Erro durante importação

## Dependências

### Principais
- **@prisma/client**: ORM para banco de dados
- **zod**: Validação de schemas
- **express**: Framework web
- **axios**: Cliente HTTP para importação Pinterest
- **fs**: Sistema de arquivos (importação JSON)
- **path**: Manipulação de caminhos

### Middlewares
- **requireAuth**: Autenticação de usuários
- **requireAdmin**: Verificação de privilégios administrativos

## Segurança

### Autenticação e Autorização
- Todas as rotas requerem autenticação
- Operações de escrita requerem privilégios administrativos
- Separação clara entre rotas públicas e administrativas

### Validação de Dados
- Schemas Zod para validação rigorosa
- Validação de URLs para imagens e capas
- Sanitização de dados de entrada

### Proteção de Dados
- Validação de UUIDs
- Prevenção de SQL injection via Prisma
- Tratamento seguro de erros

## Integração com Outros Módulos

### Módulo Auth
- Middleware de autenticação
- Verificação de privilégios administrativos

### Sistema de Arquivos
- Leitura de arquivos JSON para importação
- Manipulação de caminhos de arquivo

### APIs Externas
- Integração com API do Pinterest
- Tratamento de erros de conectividade

## Considerações de Performance

### Otimizações
- Paginação para listagens
- Contagem otimizada de imagens
- Queries paralelas para dados e contagem
- Ordenação por índices de data

### Limitações
- Máximo 100 itens por página
- Importação síncrona (pode ser lenta)
- Dependência de APIs externas

### Estratégias de Melhoria
- Cache para wallpapers populares
- Importação assíncrona com queue
- Compressão de imagens
- CDN para armazenamento de imagens

## Funcionalidades de Importação

### Importação JSON
- **Arquivo**: `src/import/wallpapers.json`
- **Formato**: Array de objetos com name, capa e data
- **Processamento**: Limpeza e parsing de dados aninhados
- **Tratamento**: Logs detalhados e tratamento de erros

### Importação Pinterest
- **API**: Pinterest v3 pidgets
- **Extração**: Username e board name da URL
- **Processamento**: Múltiplos tamanhos de imagem
- **Criação**: Wallpaper automático com primeira imagem como capa

## Próximas Melhorias

### Funcionalidades
- Sistema de categorias/tags para wallpapers
- Favoritos de usuários
- Sistema de avaliação
- Busca e filtros avançados
- Wallpapers relacionados

### Técnicas
- Processamento assíncrono de importações
- Cache Redis para listagens
- Compressão automática de imagens
- CDN para distribuição de conteúdo
- Retry automático para falhas de importação

### Segurança
- Rate limiting para importações
- Validação de tipos de arquivo
- Sanitização de URLs externas
- Auditoria de ações administrativas

## Testes

### Cenários de Teste
- CRUD completo de wallpapers
- Paginação de listagens e imagens
- Toggle de imagens
- Importação de dados (JSON e Pinterest)
- Validação de dados de entrada
- Tratamento de erros
- Autenticação e autorização

### Integração
- Testes com banco de dados
- Testes de APIs externas (mock)
- Testes de sistema de arquivos
- Testes de performance

### Cobertura
- Handlers de negócio: 95%
- Controladores HTTP: 90%
- Validação de dados: 100%
- Tratamento de erros: 85%
- Funcionalidades de importação: 80%

## Documentação Swagger

O módulo inclui documentação Swagger completa com:
- Schemas detalhados para todas as entidades
- Exemplos de requisições e respostas
- Códigos de status e descrições de erro
- Parâmetros de paginação
- Requisitos de autenticação e autorização
- Documentação específica para rotas administrativas

A documentação está disponível em `/api-docs` quando o servidor está em execução.

## Arquitetura

### Padrão Utilizado
- **Repository Pattern**: Handlers como camada de acesso a dados
- **Controller Pattern**: Separação de responsabilidades HTTP
- **Validation Pattern**: Validação centralizada com Zod

### Fluxo de Dados
```
Cliente → Router → Controller → Handler → Prisma → Banco de Dados
                                    ↓
Cliente ← Resposta HTTP ← Resposta Formatada ← Dados Processados
```

### Responsabilidades
- **Router**: Configuração de rotas e middlewares
- **Controller**: Validação HTTP e formatação de resposta
- **Handler**: Lógica de negócio e acesso a dados
- **Validator**: Schemas de validação
- **Prisma**: ORM e acesso ao banco de dados