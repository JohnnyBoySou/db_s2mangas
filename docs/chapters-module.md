# Módulo Chapters - Sistema S2Mangas

## Visão Geral

O módulo **chapters** é responsável pela gestão e visualização de capítulos de mangás no sistema S2Mangas. Este módulo integra-se com a API externa do MangaDex para fornecer informações detalhadas sobre capítulos, incluindo listagem paginada e acesso às páginas individuais dos capítulos.

## Estrutura de Diretórios

```
src/modules/chapters/
├── __tests__/
│   ├── controller.test.ts    # Testes do controlador
│   └── handler.test.ts       # Testes dos handlers
├── controllers/
│   └── ChaptersController.ts # Controladores HTTP
├── handlers/
│   └── ChaptersHandler.ts    # Lógica de negócio
├── routes/
│   └── ChaptersRouter.ts     # Definição de rotas
└── validators/               # Pasta para validadores (vazia)
```

## Funcionalidades Principais

### 1. Listagem de Capítulos
- Busca capítulos de um mangá específico via API MangaDex
- Suporte a paginação com controle de página e limite
- Filtros por idioma e ordenação (ascendente/descendente)
- Filtragem automática de capítulos sem páginas
- Formatação de datas em português brasileiro

### 2. Visualização de Páginas
- Obtenção das URLs das páginas de um capítulo específico
- Integração com servidor de imagens do MangaDx
- Transformação de dados para formato padronizado

### 3. Integração Externa
- Comunicação com API MangaDex para dados de capítulos
- Tratamento de erros de API externa
- Transformação de dados para formato interno

## Endpoints da API

### Listar Capítulos
```http
GET /chapters/manga/{id}
```

**Parâmetros:**
- `id` (path): ID do mangá
- `lang` (query): Idioma dos capítulos (padrão: "pt-br")
- `order` (query): Ordem dos capítulos - "asc" ou "desc" (padrão: "desc")
- `page` (query): Número da página (padrão: 1)
- `limit` (query): Capítulos por página (padrão: 20, máximo: 100)

**Resposta:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Capítulo 1 - O Início",
      "chapter": 1.0,
      "volume": 1.0,
      "language": ["pt-br"],
      "publish_date": "15 jan 2024",
      "pages": 20
    }
  ],
  "first_page_url": "http://localhost:3000/chapters/manga/123?page=1&limit=20&lang=pt-br&order=desc",
  "from": 1,
  "last_page": 5,
  "last_page_url": "http://localhost:3000/chapters/manga/123?page=5&limit=20&lang=pt-br&order=desc",
  "next_page_url": "http://localhost:3000/chapters/manga/123?page=2&limit=20&lang=pt-br&order=desc",
  "path": "http://localhost:3000/chapters/manga/123",
  "per_page": 20,
  "prev_page_url": null,
  "to": 20,
  "total": 100
}
```

### Obter Páginas do Capítulo
```http
GET /chapters/{chapterID}/pages
```

**Parâmetros:**
- `chapterID` (path): ID do capítulo

**Resposta:**
```json
{
  "pages": [
    "https://uploads.mangadx.org/data/abc123/page1.jpg",
    "https://uploads.mangadx.org/data/abc123/page2.jpg"
  ],
  "total": 20,
  "chapter_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Schemas de Dados

### Chapter
```typescript
interface Chapter {
  id: string;              // ID único do capítulo
  title: string;           // Título do capítulo
  chapter: number;         // Número do capítulo
  volume: number | null;   // Número do volume
  language: string[];      // Idiomas disponíveis
  publish_date: string;    // Data de publicação formatada
  pages: number;           // Número de páginas
}
```

### ChapterListResponse
```typescript
interface ChapterListResponse {
  current_page: number;        // Página atual
  data: Chapter[];             // Lista de capítulos
  first_page_url: string;      // URL da primeira página
  from: number;                // Índice do primeiro item
  last_page: number;           // Número da última página
  last_page_url: string;       // URL da última página
  next_page_url: string | null; // URL da próxima página
  path: string;                // URL base da paginação
  per_page: number;            // Itens por página
  prev_page_url: string | null; // URL da página anterior
  to: number;                  // Índice do último item
  total: number;               // Total de capítulos
}
```

### ChapterPagesResponse
```typescript
interface ChapterPagesResponse {
  pages: string[];    // URLs das páginas do capítulo
  total: number;      // Total de páginas
  chapter_id: string; // ID do capítulo
}
```

## Lógica de Negócio

### Listagem de Capítulos
```typescript
// Busca capítulos via API MangaDx
const response = await axios.get(`https://api.mangadx.org/manga/${id}/feed`, {
  params: {
    includeEmptyPages: 0,
    includeFuturePublishAt: 0,
    includeExternalUrl: 0,
    limit,
    offset,
    translatedLanguage: [lg],
    contentRating: ['safe', 'suggestive', 'erotica', 'pornographic'],
    order: { chapter: order }
  }
});

// Transformação e filtragem de dados
const transformedChapters = chapters
  .map(chapter => {
    const attributes = chapter.attributes || {};
    const pages = attributes.pages || 0;
    
    // Filtra capítulos sem páginas
    if (pages === 0) return null;
    
    return {
      id: chapter.id,
      title: attributes.title || `Capítulo ${attributes.chapter || 0}`,
      chapter: parseFloat(attributes.chapter) || 0,
      volume: attributes.volume ? parseFloat(attributes.volume) : null,
      language: [attributes.translatedLanguage || ''],
      publish_date: formatDate(attributes.publishAt),
      pages
    };
  })
  .filter(Boolean);
```

### Obtenção de Páginas
```typescript
// Busca dados do capítulo
const chapterResponse = await axios.get(
  `https://api.mangadx.org/at-home/server/${chapterID}`
);

// Transformação das URLs das páginas
const pages = chapterData.data.map(page => 
  `https://uploads.mangadx.org/data/${chapterData.hash}/${page}`
);
```

## Controladores HTTP

### ChaptersController
- **list**: Lista capítulos de um mangá com paginação
- **getPages**: Obtém páginas de um capítulo específico

Ambos controladores incluem:
- Validação de parâmetros de entrada
- Tratamento de erros com logs
- Formatação de resposta padronizada
- Construção de URLs de paginação completas

## Configuração de Rotas

```typescript
// ChaptersRouter.ts
const ChaptersRouter = Router();
ChaptersRouter.get('/manga/:id', list);           // Listar capítulos
ChaptersRouter.get('/:chapterID/pages', getPages); // Obter páginas
```

**Características:**
- Rotas públicas (sem autenticação)
- Parâmetros dinâmicos para IDs
- Estrutura RESTful

## Tratamento de Erros

### Códigos de Status
- **200**: Sucesso na operação
- **500**: Erro interno do servidor

### Tipos de Erro
1. **Falha na API Externa**: Quando MangaDx retorna erro
2. **Dados Inválidos**: Quando capítulo não possui dados necessários
3. **Capítulo Não Encontrado**: Quando ID do capítulo é inválido

### Tratamento Centralizado
```typescript
try {
  const result = await chapterHandlers.listChapters(params);
  res.json(result);
} catch (error) {
  console.error('Erro ao buscar capítulos:', error);
  res.status(500).json({ 
    error: error instanceof Error ? error.message : 'Erro desconhecido' 
  });
}
```

## Dependências

### Internas
- Nenhuma dependência interna específica

### Externas
- **axios**: Cliente HTTP para comunicação com API MangaDx
- **express**: Framework web para rotas e controladores

## Segurança

### Validação de Entrada
- Validação de tipos de parâmetros
- Sanitização de valores de paginação
- Limites máximos para parâmetros de consulta

### Proteção de Dados
- Filtragem de capítulos sem conteúdo
- Validação de dados da API externa
- Tratamento seguro de erros sem exposição de detalhes internos

## Integração com Outros Módulos

### Módulo Manga
- Utiliza IDs de mangás para buscar capítulos
- Complementa informações de mangás com capítulos disponíveis

### Módulo Library
- Fornece dados de capítulos para histórico de leitura
- Suporte a marcação de capítulos lidos

## Considerações de Performance

### Otimizações Implementadas
1. **Filtragem Eficiente**: Remove capítulos sem páginas antes do processamento
2. **Paginação**: Limita quantidade de dados transferidos
3. **Cache de API**: Potencial para implementação de cache de respostas

### Limitações
1. **Dependência Externa**: Performance limitada pela API MangaDx
2. **Sem Cache**: Todas as requisições vão para API externa
3. **Processamento Síncrono**: Transformação de dados em memória

### Estratégias de Melhoria
- Implementar cache Redis para respostas da API
- Adicionar retry logic para falhas de rede
- Implementar rate limiting para evitar sobrecarga da API externa

## Próximas Melhorias

### Funcionalidades Avançadas
1. **Cache Inteligente**: Sistema de cache com TTL configurável
2. **Offline Support**: Armazenamento local de capítulos populares
3. **Múltiplas Fontes**: Integração com outras APIs de mangás
4. **Qualidade de Imagem**: Opções de qualidade para páginas

### Sistema de Capítulos
1. **Favoritos**: Marcar capítulos como favoritos
2. **Download**: Sistema de download de capítulos
3. **Sincronização**: Sync entre dispositivos
4. **Notificações**: Alertas para novos capítulos

### Analytics
1. **Métricas de Leitura**: Tempo gasto por capítulo
2. **Capítulos Populares**: Ranking de capítulos mais lidos
3. **Estatísticas de Uso**: Padrões de consumo

### Performance
1. **CDN Integration**: Distribuição de imagens via CDN
2. **Lazy Loading**: Carregamento sob demanda
3. **Compressão**: Otimização de imagens
4. **Prefetch**: Pré-carregamento de próximos capítulos

## Testes

### Testes Unitários
- **Handlers**: Testes de lógica de negócio e integração com API
- **Controllers**: Testes de endpoints e tratamento de erros
- **Transformações**: Testes de formatação de dados

### Testes de Integração
- **API Externa**: Testes com mock da API MangaDx
- **Fluxo Completo**: Testes end-to-end de listagem e visualização
- **Tratamento de Erros**: Cenários de falha da API externa

### Cobertura de Testes
- Handlers: 100% das funções principais
- Controllers: Cenários de sucesso e erro
- Validações: Todos os tipos de entrada

### Estratégias de Teste
```typescript
// Exemplo de teste de handler
describe('listChapters', () => {
  it('deve listar capítulos com sucesso', async () => {
    // Mock da resposta da API
    mockedAxios.get.mockResolvedValue(mockResponse);
    
    const result = await listChapters(params);
    
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(50);
  });
});
```

## Documentação Swagger

O módulo possui documentação completa no Swagger com:
- Schemas detalhados para todas as entidades
- Exemplos de requisições e respostas
- Descrição de parâmetros e códigos de erro
- Tags organizadas por funcionalidade

### Acesso à Documentação
- Endpoint: `/api-docs`
- Seção: "Capítulos"
- Schemas: Chapter, ChapterListResponse, ChapterPagesResponse