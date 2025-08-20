# Middlewares do S2Mangas

## Visão Geral

Os middlewares do S2Mangas são componentes essenciais que interceptam e processam requisições HTTP antes que cheguem aos controladores finais. Eles fornecem funcionalidades transversais como autenticação, autorização, cache, observabilidade e documentação.

## Estrutura de Diretórios

```
src/middlewares/
├── admin.ts           # Controle de acesso administrativo
├── auth.ts            # Autenticação de usuários
├── cache.ts           # Sistema de cache básico
├── observability.ts   # Monitoramento e observabilidade
├── scalarDocs.ts      # Configuração da documentação API
└── smartCache.ts      # Sistema de cache inteligente
```

## Middlewares Disponíveis

### 1. Admin Middleware (`admin.ts`)

**Propósito**: Controla o acesso a recursos administrativos, verificando se o usuário possui privilégios de administrador.

#### Funcionalidades
- **`requireAdmin`**: Verifica se o usuário autenticado possui privilégios de administrador
- Consulta o banco de dados para verificar o campo `isAdmin`
- Retorna erro 401 se não autenticado
- Retorna erro 403 se não for administrador
- Tratamento de erros com logs detalhados

#### Uso
```typescript
import { requireAdmin } from '@/middlewares/admin';

// Aplicar em rotas administrativas
router.post('/admin/resource', requireAdmin, controller);
```

#### Códigos de Status
- **401**: Usuário não autenticado
- **403**: Acesso negado (não é administrador)
- **500**: Erro interno do servidor

---

### 2. Auth Middleware (`auth.ts`)

**Propósito**: Gerencia a autenticação de usuários através de tokens JWT e controle de acesso administrativo com cache.

#### Funcionalidades

##### `requireAuth`
- Verifica e valida tokens JWT no header Authorization
- Decodifica o token e adiciona informações do usuário ao objeto `req`
- Suporte ao formato "Bearer {token}"

##### `requireAdmin` (versão com cache)
- Versão otimizada do controle administrativo
- Cache Redis para verificações de privilégios (comentado, mas preparado)
- TTL configurável para cache de administradores
- Fallback para consulta direta ao banco de dados

#### Configuração
- **JWT_SECRET**: Chave secreta para validação de tokens
- **ADMIN_CACHE_TTL**: Tempo de vida do cache (3600 segundos)

#### Uso
```typescript
import { requireAuth, requireAdmin } from '@/middlewares/auth';

// Autenticação básica
router.get('/protected', requireAuth, controller);

// Acesso administrativo
router.post('/admin/action', requireAuth, requireAdmin, controller);
```

#### Códigos de Status
- **401**: Token não fornecido ou inválido
- **403**: Acesso negado (não é administrador)
- **500**: Erro interno do servidor

---

### 3. Cache Middleware (`cache.ts`)

**Propósito**: Implementa cache básico para requisições GET usando Redis.

#### Funcionalidades
- **`cacheMiddleware(ttl)`**: Middleware configurável de cache
- Cache apenas para requisições GET
- Chave de cache baseada na URL original
- Interceptação da resposta JSON para armazenamento
- TTL (Time To Live) configurável
- Logs de erro para falhas de cache

#### Parâmetros
- **ttl**: Tempo de vida do cache em segundos

#### Uso
```typescript
import { cacheMiddleware } from '@/middlewares/cache';

// Cache de 5 minutos
router.get('/api/data', cacheMiddleware(300), controller);

// Cache de 1 hora
router.get('/api/static', cacheMiddleware(3600), controller);
```

#### Comportamento
- **Cache Hit**: Retorna dados diretamente do Redis
- **Cache Miss**: Executa o controlador e armazena a resposta
- **Erro**: Continua sem cache em caso de falha

---

### 4. Observability Middleware (`observability.ts`)

**Propósito**: Fornece monitoramento completo, logging e métricas de performance para todas as requisições.

#### Funcionalidades

##### `observabilityMiddleware`
- Geração de Request ID único para rastreamento
- Logging detalhado de início e fim de requisições
- Métricas de performance (duração, status code)
- Context logging com informações do usuário
- Headers de rastreamento (X-Request-ID)

##### `errorObservabilityMiddleware`
- Captura e log de erros não tratados
- Informações detalhadas de stack trace
- Métricas de duração até o erro
- Context preservation para debugging

##### `databaseObservabilityMiddleware`
- Interceptação de queries do Prisma
- Métricas de performance de banco de dados
- Logging de queries lentas
- Tratamento de erros de banco

##### `cacheObservabilityMiddleware`
- Monitoramento de operações Redis
- Métricas de cache hit/miss
- Performance de operações get/set
- Logging de falhas de cache

##### `generateHealthReport`
- Relatório de saúde do sistema
- Métricas de uptime e memória
- Informações do ambiente Railway
- CPU usage e system metrics

#### Métricas Coletadas
- Duração de requisições HTTP
- Status codes de resposta
- Performance de queries de banco
- Eficiência do cache
- Uso de memória e CPU

#### Uso
```typescript
import { 
  observabilityMiddleware, 
  errorObservabilityMiddleware,
  generateHealthReport 
} from '@/middlewares/observability';

// Aplicar globalmente
app.use(observabilityMiddleware);
app.use(errorObservabilityMiddleware);

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json(generateHealthReport());
});
```

---

### 5. Scalar Docs Middleware (`scalarDocs.ts`)

**Propósito**: Configura a documentação interativa da API usando Scalar.

#### Funcionalidades
- **`setupScalarDocs`**: Configura o endpoint de documentação
- Integração com especificação OpenAPI/Swagger
- Interface interativa para teste de APIs
- Tratamento gracioso de falhas de configuração

#### Configuração
- **Endpoint**: `/docs/scalar`
- **Spec URL**: `/api-docs.json`
- **Fallback**: Warning em caso de erro de configuração

#### Uso
```typescript
import { setupScalarDocs } from '@/middlewares/scalarDocs';

// Configurar durante inicialização do app
setupScalarDocs(app);
```

#### Recursos
- Interface web interativa
- Teste de endpoints em tempo real
- Documentação automática baseada em schemas
- Suporte a autenticação

---

### 6. Smart Cache Middleware (`smartCache.ts`)

**Propósito**: Sistema de cache avançado e inteligente com configurações específicas por tipo de endpoint.

#### Funcionalidades

##### `smartCacheMiddleware(type, customConfig?)`
- Cache configurável por tipo de endpoint
- Geração inteligente de chaves de cache
- Suporte a tags para invalidação
- Compressão opcional de dados
- Cache L2 para dados críticos
- Headers de cache HTTP padrão

##### `cacheInvalidationMiddleware(tags)`
- Invalidação automática baseada em tags
- Execução após operações de modificação
- Invalidação assíncrona para performance

##### `imageCacheMiddleware(resolutions?)`
- Cache especializado para imagens
- Suporte a múltiplas resoluções
- Cache de longa duração (24 horas)
- Validação de resoluções suportadas

##### `conditionalCacheMiddleware()`
- Cache condicional usando ETags
- Resposta 304 Not Modified
- Redução de tráfego de rede

##### `warmupCache(routes?)`
- Pré-aquecimento de cache
- Rotas configuráveis
- Execução em background

#### Configurações Padrão

```typescript
const DEFAULT_CONFIGS = {
  manga: {
    ttl: 3600,        // 1 hora
    tags: ['manga'],
    varyBy: ['id', 'lg', 'userId'],
    compression: true,
    l2Cache: true
  },
  discover: {
    ttl: 300,         // 5 minutos
    tags: ['discover', 'manga'],
    varyBy: ['page', 'take', 'lg', 'userId'],
    compression: true,
    l2Cache: false
  },
  search: {
    ttl: 600,         // 10 minutos
    tags: ['search'],
    varyBy: ['q', 'page', 'limit', 'lg', 'categories'],
    compression: true,
    l2Cache: true
  },
  categories: {
    ttl: 86400,       // 24 horas
    tags: ['categories'],
    varyBy: ['lg'],
    compression: false,
    l2Cache: true
  },
  user: {
    ttl: 1800,        // 30 minutos
    tags: ['user'],
    varyBy: ['id', 'userId'],
    compression: true,
    l2Cache: false
  },
  library: {
    ttl: 900,         // 15 minutos
    tags: ['library', 'user'],
    varyBy: ['userId', 'page', 'limit', 'status'],
    compression: true,
    l2Cache: false
  }
};
```

#### Uso
```typescript
import { 
  smartCacheMiddleware, 
  cacheInvalidationMiddleware,
  imageCacheMiddleware 
} from '@/middlewares/smartCache';

// Cache inteligente para mangás
router.get('/manga/:id', smartCacheMiddleware('manga'), controller);

// Invalidação após atualização
router.put('/manga/:id', 
  cacheInvalidationMiddleware(['manga']), 
  controller
);

// Cache de imagens
router.get('/images/:id', 
  imageCacheMiddleware(['thumbnail', 'medium', 'large']), 
  controller
);
```

#### Headers de Cache
- **X-Cache**: HIT/MISS status
- **X-Cache-Key**: Chave de cache utilizada
- **Cache-Control**: Diretivas de cache HTTP
- **ETag**: Hash para validação condicional

## Integração e Dependências

### Dependências Principais
- **Express**: Framework base para middlewares
- **jsonwebtoken**: Validação de tokens JWT
- **Prisma**: ORM para consultas de banco
- **Redis**: Sistema de cache distribuído
- **@scalar/express-api-reference**: Documentação interativa

### Utilitários Integrados
- **Logger**: Sistema de logging centralizado
- **Advanced Cache**: Utilitários de cache avançado
- **Performance Metrics**: Coleta de métricas

## Segurança

### Práticas Implementadas
- **Token Validation**: Verificação rigorosa de JWTs
- **Authorization Layers**: Múltiplos níveis de autorização
- **Error Handling**: Tratamento seguro de erros
- **Request Tracking**: Rastreamento para auditoria
- **Sensitive Data**: Redação de dados sensíveis em logs

### Considerações
- Tokens JWT devem ser mantidos seguros
- Cache pode conter dados sensíveis
- Logs devem ser monitorados regularmente
- Rate limiting pode ser necessário

## Performance

### Otimizações
- **Cache Inteligente**: Reduz carga no banco de dados
- **Cache L2**: Múltiplas camadas de cache
- **Compressão**: Reduz uso de memória
- **Async Operations**: Operações não-bloqueantes
- **Connection Pooling**: Reutilização de conexões

### Métricas
- Tempo de resposta de requisições
- Taxa de cache hit/miss
- Performance de queries de banco
- Uso de memória e CPU

## Monitoramento

### Logs Disponíveis
- **Request Logs**: Todas as requisições HTTP
- **Error Logs**: Erros e exceções
- **Performance Logs**: Métricas de performance
- **Cache Logs**: Operações de cache
- **Database Logs**: Queries e performance

### Health Checks
- **System Health**: Status geral do sistema
- **Database Health**: Conectividade do banco
- **Cache Health**: Status do Redis
- **Memory Usage**: Uso de memória
- **Uptime**: Tempo de atividade

## Próximas Melhorias

### Funcionalidades
- [ ] Rate limiting por usuário/IP
- [ ] Cache warming automático
- [ ] Métricas de negócio personalizadas
- [ ] Alertas automáticos
- [ ] Dashboard de monitoramento

### Técnicas
- [ ] Circuit breaker pattern
- [ ] Distributed tracing
- [ ] A/B testing support
- [ ] Feature flags
- [ ] Auto-scaling triggers

### Segurança
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection
- [ ] API key management
- [ ] OAuth2 integration
- [ ] RBAC (Role-Based Access Control)

## Testes

### Cenários de Teste
- **Unit Tests**: Cada middleware isoladamente
- **Integration Tests**: Fluxo completo de requisições
- **Performance Tests**: Carga e stress testing
- **Security Tests**: Penetration testing
- **Cache Tests**: Validação de estratégias de cache

### Cobertura Recomendada
- Autenticação e autorização
- Cache hit/miss scenarios
- Error handling paths
- Performance under load
- Security vulnerabilities

## Troubleshooting

### Problemas Comuns

#### Cache não funcionando
- Verificar conexão Redis
- Validar configuração de TTL
- Checar logs de erro

#### Autenticação falhando
- Verificar JWT_SECRET
- Validar formato do token
- Checar expiração do token

#### Performance degradada
- Analisar métricas de cache
- Verificar queries lentas
- Monitorar uso de memória

#### Logs não aparecendo
- Verificar configuração do logger
- Validar níveis de log
- Checar permissões de arquivo

### Comandos Úteis
```bash
# Verificar status do Redis
redis-cli ping

# Monitorar logs em tempo real
tail -f logs/app.log

# Verificar métricas de performance
curl http://localhost:3000/health

# Limpar cache manualmente
redis-cli flushall
```

---

*Esta documentação cobre todos os middlewares do sistema S2Mangas. Para informações específicas sobre implementação, consulte os arquivos de código fonte em `src/middlewares/`.*