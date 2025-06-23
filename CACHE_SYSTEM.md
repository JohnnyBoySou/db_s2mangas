# Sistema de Cache Avançado - DB S2 Mangas

## Visão Geral

O sistema de cache avançado implementa uma arquitetura de múltiplas camadas para otimizar a performance da aplicação:

- **L1 Cache (Redis)**: Cache em memória de alta velocidade
- **L2 Cache (File System)**: Cache persistente em disco
- **CDN Simulation**: Simulação de CDN para recursos estáticos
- **Intelligent Caching**: Cache inteligente para queries do Prisma
- **Image Optimization**: Cache de imagens com múltiplas resoluções

## Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   L1 (Redis)    │───▶│  L2 (FileSystem)│───▶│   Database      │
│   TTL: 5-60min  │    │   TTL: 1-7 days │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Image Cache    │    │   CDN Cache     │
│  Multi-res      │    │   Static Files  │
└─────────────────┘    └─────────────────┘
```

## Componentes Principais

### 1. Advanced Cache Manager (`src/utils/advancedCache.ts`)

**Funcionalidades:**
- Cache L1 (Redis) e L2 (File System)
- Compressão automática de dados
- Invalidação baseada em tags
- Limpeza automática de cache expirado

**Uso:**
```typescript
import { AdvancedCacheManager } from '@/utils/advancedCache';

const cache = new AdvancedCacheManager();

// Armazenar dados
await cache.set('manga:123', mangaData, 3600, ['manga', 'discover']);

// Recuperar dados
const data = await cache.get('manga:123');

// Invalidar por tags
await cache.invalidateByTags(['manga']);
```

### 2. Smart Cache Middleware (`src/middlewares/smartCache.ts`)

**Middlewares disponíveis:**
- `smartCacheMiddleware`: Cache inteligente para endpoints
- `cacheInvalidationMiddleware`: Invalidação automática
- `imageCacheMiddleware`: Cache de imagens otimizado
- `conditionalCacheMiddleware`: Cache condicional com ETags

**Configuração por endpoint:**
```typescript
// Cache para manga com TTL de 1 hora
router.get('/manga/:id', smartCacheMiddleware('manga'), getManga);

// Cache de imagens com otimização
router.get('/images/:id', imageCacheMiddleware(), getImage);

// Invalidação automática em updates
router.put('/manga/:id', cacheInvalidationMiddleware(['manga']), updateManga);
```

### 3. Prisma Cache Extension (`src/utils/prismaCache.ts`)

**Funcionalidades:**
- Cache automático de queries do Prisma
- Invalidação inteligente baseada em operações
- Estatísticas de cache hits/misses
- Configuração por modelo

**Uso:**
```typescript
import { createCachedPrismaClient } from '@/utils/prismaCache';

const prisma = createCachedPrismaClient();

// Queries são automaticamente cacheadas
const manga = await prisma.manga.findUnique({ where: { id: '123' } });

// Estatísticas
const stats = getCacheStats();
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`);
```

### 4. Image Cache System (`src/utils/imageCache.ts`)

**Resoluções suportadas:**
- `thumbnail`: 150x200
- `small`: 300x400
- `medium`: 600x800
- `large`: 900x1200
- `original`: Tamanho original

**Formatos suportados:**
- JPEG (compatibilidade)
- WebP (otimizado)
- AVIF (mais moderno)

**Uso:**
```typescript
import { ImageCacheManager } from '@/utils/imageCache';

const imageCache = new ImageCacheManager();

// Processar e cachear imagem
const processedImage = await imageCache.processAndCache(
  imageBuffer,
  'manga:123:cover',
  'medium',
  'webp'
);
```

### 5. CDN Simulation (`src/config/cdn.ts`)

**Middlewares:**
- `cdnMiddleware`: Simula comportamento de CDN
- `imageOptimizationMiddleware`: Otimização automática de imagens
- `staticCacheMiddleware`: Cache de recursos estáticos

**Headers automáticos:**
- Cache-Control com TTL apropriado
- ETag para validação condicional
- Compressão automática
- Headers de segurança

## API de Gerenciamento

### Endpoints disponíveis (`/cache/*`):

#### Estatísticas
```http
GET /cache/stats
```
Retorna estatísticas completas do sistema de cache.

#### Monitoramento em tempo real
```http
GET /cache/monitor
```
Stream de eventos para monitoramento em tempo real.

#### Invalidação
```http
# Por tags
DELETE /cache/invalidate/tags
Content-Type: application/json
{ "tags": ["manga", "discover"] }

# Por modelo Prisma
DELETE /cache/invalidate/prisma/:model

# Limpar tudo
DELETE /cache/clear
```

#### Warming
```http
POST /cache/warm
```
Pré-aquece o cache com dados frequentemente acessados.

#### Gerenciamento de chaves
```http
# Listar chaves
GET /cache/keys?pattern=manga:*

# Obter valor
GET /cache/key/:key

# Definir valor
PUT /cache/key/:key
Content-Type: application/json
{ "value": "data", "ttl": 3600 }
```

## Configuração

### Variáveis de ambiente

```env
# Redis L1 Cache
REDIS_URL=redis://localhost:6379
REDIS_L1_DB=1

# CDN
CDN_ENABLED=true
CDN_BASE_URL=https://cdn.example.com
CDN_REGIONS=us-east-1,eu-west-1,ap-southeast-1

# Cache paths
CACHE_DIR=./cache
IMAGE_CACHE_DIR=./cache/images

# Limits
L2_CACHE_MAX_SIZE=1073741824  # 1GB
IMAGE_CACHE_MAX_SIZE=2147483648  # 2GB
```

### TTL Configuration

Os TTLs são configurados em `src/config/redis.ts`:

```typescript
export const cacheTTL = {
  manga: { l1: 3600, l2: 86400 },      // 1h / 1d
  discover: { l1: 1800, l2: 43200 },   // 30m / 12h
  search: { l1: 900, l2: 7200 },       // 15m / 2h
  images: { l1: 7200, l2: 604800 },    // 2h / 7d
  // ...
};
```

## Monitoramento

### Logs
Todos os eventos de cache são logados com diferentes níveis:
- `info`: Operações normais
- `warn`: Cache misses, limpezas
- `error`: Falhas de conexão, erros

### Métricas
Estatísticas disponíveis:
- Hit/miss ratio por tipo
- Tamanho do cache L1/L2
- Número de chaves ativas
- Tempo médio de resposta
- Operações de invalidação

### Alertas
O sistema monitora:
- Uso de memória Redis
- Tamanho do cache L2
- Taxa de erro
- Performance de queries

## Estratégias de Cache

### 1. Cache-Aside (Lazy Loading)
Dados são carregados no cache apenas quando solicitados.

### 2. Write-Through
Dados são escritos no cache e banco simultaneamente.

### 3. Write-Behind (Write-Back)
Dados são escritos no cache imediatamente e no banco de forma assíncrona.

### 4. Refresh-Ahead
Cache é atualizado antes da expiração baseado em padrões de acesso.

## Otimizações

### Compressão
- Dados > 1KB são automaticamente comprimidos
- Algoritmo gzip para compatibilidade
- Redução de 60-80% no uso de memória

### Invalidação Inteligente
- Baseada em tags relacionais
- Invalidação em cascata
- Prevenção de cache stampede

### Image Optimization
- Conversão automática para formatos modernos
- Múltiplas resoluções
- Lazy loading support
- Progressive JPEG

## Troubleshooting

### Cache Miss Alto
1. Verificar TTL configuration
2. Analisar padrões de invalidação
3. Revisar tags de cache
4. Monitorar uso de memória

### Performance Issues
1. Verificar conexão Redis
2. Analisar tamanho do cache L2
3. Revisar compressão
4. Otimizar queries Prisma

### Memory Issues
1. Ajustar TTLs
2. Implementar LRU eviction
3. Aumentar limpeza automática
4. Revisar tamanhos de cache

## Roadmap

### Próximas funcionalidades:
- [ ] Cache distribuído multi-instância
- [ ] Machine learning para TTL dinâmico
- [ ] Cache warming inteligente
- [ ] Integração com CDN real
- [ ] Métricas avançadas com Prometheus
- [ ] Dashboard de monitoramento
- [ ] Cache de queries GraphQL
- [ ] Suporte a cache hierárquico

## Contribuição

Para contribuir com melhorias no sistema de cache:

1. Teste thoroughly em ambiente local
2. Adicione testes unitários
3. Documente mudanças
4. Monitore impacto na performance
5. Considere backward compatibility

## Licença

Este sistema de cache é parte do projeto DB S2 Mangas e segue a mesma licença do projeto principal.