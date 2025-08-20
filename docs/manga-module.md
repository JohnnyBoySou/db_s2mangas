# Módulo Manga

## Visão Geral

O módulo **Manga** é responsável pela gestão completa de mangás no sistema S2Mangas. Este módulo oferece funcionalidades abrangentes para criação, edição, visualização, importação e gerenciamento de mangás, incluindo integração com APIs externas como MangaDex para importação de dados e capítulos.

## Estrutura do Diretório

```
src/modules/manga/
├── controllers/
│   └── MangaController.ts      # Controladores HTTP para mangás
├── handlers/
│   └── MangaHandler.ts         # Lógica de negócio para mangás
├── routes/
│   └── MangaRouter.ts          # Definição das rotas
├── validators/
│   └── MangaValidator.ts       # Schemas de validação Zod
└── __tests__/
    └── *.test.ts               # Testes unitários
```

## Funcionalidades Principais

### 1. Gestão de Mangás
- **Criação de mangás** com suporte a múltiplas traduções e idiomas
- **Listagem paginada** com filtros por categoria e idioma
- **Visualização detalhada** com dados traduzidos
- **Atualização completa** (PUT) e parcial (PATCH)
- **Exclusão** com limpeza de relacionamentos
- **Busca por categoria** com paginação

### 2. Integração com MangaDex
- **Importação de mangás** diretamente da API do MangaDex
- **Busca de capítulos** com paginação e filtros de idioma
- **Obtenção de páginas** de capítulos com diferentes qualidades
- **Download de capas** em múltiplas resoluções
- **Sincronização de metadados** (título, descrição, status, tipo)

### 3. Sistema de Capítulos
- **Listagem de capítulos** com ordenação customizável
- **Navegação entre capítulos** (anterior/próximo)
- **Suporte a capítulos externos** via URL
- **Múltiplas qualidades** de imagem (alta/baixa)
- **Metadados completos** (volume, número, data de publicação)

### 4. Gestão de Capas
- **Múltiplas capas** por mangá
- **Cache inteligente** de imagens
- **Diferentes resoluções** (thumbnail, small, medium)
- **Integração com CDN** do MangaDex

### 5. Importação de Dados
- **Importação em lote** via arquivos JSON
- **Migração de dados** de sistemas MySQL legados
- **Criação automática** de categorias e idiomas
- **Tratamento de duplicatas** e conflitos

### 6. Sistema de Similaridade
- **Recomendações** baseadas em categorias
- **Algoritmo de similaridade** por gêneros e tags
- **Cache de resultados** para performance

## Schemas de Validação

### CreateMangaSchema
```typescript
{
  cover: string (URL obrigatória),
  status?: string,
  type?: string,
  releaseDate?: Date,
  manga_uuid?: string,
  languageIds: string[] (mínimo 1),
  categoryIds?: string[],
  translations: {
    language: string,
    name: string,
    description?: string
  }[] (mínimo 1)
}
```

### UpdateMangaSchema
```typescript
{
  cover?: string (URL),
  status?: string,
  type?: string,
  releaseDate?: Date,
  languageIds: string[] (mínimo 1),
  categoryIds?: string[],
  translations: {
    language: string,
    name: string (obrigatório),
    description?: string
  }[] (mínimo 1)
}
```

### PatchMangaSchema
```typescript
{
  cover?: string (URL),
  status?: string,
  type?: string,
  releaseDate?: Date,
  languageIds?: string[],
  categoryIds?: string[],
  translations?: {
    language: string,
    name: string,
    description?: string
  }[]
}
```

## Rotas da API

### Rotas Públicas (Usuários Autenticados)
- `GET /manga/:id/covers` - Obter capas do mangá
- `GET /manga/category` - Listar mangás por categoria
- `GET /manga/:id` - Obter detalhes do mangá
- `GET /manga/chapters/:chapterID/pages` - Obter páginas do capítulo
- `GET /manga/:id/chapters` - Listar capítulos do mangá
- `GET /manga/:id/similar` - Obter mangás similares

### Rotas Administrativas
- `GET /admin/mangas` - Listar todos os mangás
- `POST /admin/mangas` - Criar novo mangá
- `PUT /admin/mangas/:id` - Atualizar mangá completo
- `PATCH /admin/mangas/:id` - Atualizar mangá parcial
- `DELETE /admin/mangas/:id` - Excluir mangá
- `DELETE /admin/mangas/clear` - Limpar tabela de mangás
- `POST /admin/mangas/import` - Importar do MangaDex
- `POST /admin/mangas/import_json/file/:filename` - Importar de arquivo JSON

## Middlewares Utilizados

### Autenticação
- `requireAuth` - Autenticação obrigatória
- `requireAdmin` - Acesso apenas para administradores

### Cache
- `smartCacheMiddleware` - Cache inteligente com TTL configurável
- `imageCacheMiddleware` - Cache específico para imagens
- `cacheInvalidationMiddleware` - Invalidação automática de cache

### Variações de Cache
- **manga**: Cache por ID do mangá
- **categories**: Cache por categorias
- **chapter**: Cache por capítulo
- **discover**: Cache para descoberta (TTL: 30min)
- **images**: Cache para imagens

## Funcionalidades Avançadas

### Sistema de Traduções
- **Múltiplos idiomas** por mangá
- **Fallback automático** para inglês ou primeira tradução disponível
- **Busca inteligente** por idioma preferido
- **Suporte a localização** dinâmica

### Integração com MangaDex API
- **Rate limiting** respeitado
- **Headers apropriados** para requisições
- **Tratamento de erros** da API externa
- **Transformação de dados** para formato interno

### Performance e Otimização
- **Queries otimizadas** com includes seletivos
- **Paginação eficiente** em todas as listagens
- **Cache em múltiplas camadas**
- **Lazy loading** de relacionamentos

### Gestão de Arquivos
- **Upload de capas** com validação
- **Processamento de imagens** em diferentes resoluções
- **CDN integration** para distribuição
- **Cleanup automático** de arquivos órfãos

## Tratamento de Erros

### Erros Comuns
- **Mangá não encontrado** (404)
- **UUID inválido** (400)
- **Dados de validação** (400)
- **Permissões insuficientes** (403)
- **Falha na API externa** (502)

### Validação de Dados
- **Zod schemas** para validação rigorosa
- **Mensagens de erro** descritivas
- **Sanitização** de entrada
- **Tratamento de tipos** automático

## Dependências Principais

### Internas
- `@/prisma/client` - Cliente do banco de dados
- `@/utils/zodError` - Tratamento de erros Zod
- `@/utils/pagination` - Utilitários de paginação
- `@/middlewares/auth` - Middlewares de autenticação
- `@/middlewares/smartCache` - Sistema de cache

### Externas
- `axios` - Cliente HTTP para APIs externas
- `zod` - Validação de schemas
- `fs/promises` - Operações de arquivo assíncronas
- `path` - Manipulação de caminhos

## Testes

### Cobertura de Testes
- **Controladores**: Testes de integração HTTP
- **Handlers**: Testes unitários de lógica de negócio
- **Validadores**: Testes de schemas Zod
- **Rotas**: Testes de middleware e autenticação

### Cenários Testados
- Criação de mangás com dados válidos/inválidos
- Atualização completa e parcial
- Importação do MangaDex
- Listagem com filtros e paginação
- Gestão de capítulos e páginas
- Sistema de cache
- Tratamento de erros

## Próximas Melhorias

### Funcionalidades Planejadas
- **Sistema de tags** avançado
- **Recomendações por IA** baseadas em comportamento
- **Sincronização automática** com MangaDex
- **Suporte a múltiplas fontes** de dados
- **Sistema de favoritos** avançado

### Otimizações Técnicas
- **GraphQL** para queries flexíveis
- **Elasticsearch** para busca avançada
- **Redis** para cache distribuído
- **WebSockets** para atualizações em tempo real
- **CDN própria** para imagens

## Integração com Outros Módulos

### Módulos Dependentes
- **Library**: Gestão de biblioteca pessoal
- **Collection**: Coleções de usuário
- **Analytics**: Métricas de visualização
- **Search**: Busca avançada
- **Discover**: Sistema de descoberta

### Dados Compartilhados
- **Metadados de mangás** para outros módulos
- **Estatísticas de visualização** para analytics
- **Dados de capítulos** para leitura
- **Informações de categoria** para filtros
- **Sistema de traduções** para localização

## Considerações de Segurança

### Validação de Entrada
- **Sanitização** de URLs de capa
- **Validação** de UUIDs do MangaDex
- **Limitação** de tamanho de dados
- **Escape** de caracteres especiais

### Controle de Acesso
- **Autenticação obrigatória** para todas as rotas
- **Autorização administrativa** para operações sensíveis
- **Rate limiting** para APIs externas
- **Logs de auditoria** para operações críticas

### Proteção de Dados
- **Não exposição** de dados sensíveis
- **Criptografia** de dados em trânsito
- **Backup** automático de metadados
- **Compliance** com LGPD/GDPR