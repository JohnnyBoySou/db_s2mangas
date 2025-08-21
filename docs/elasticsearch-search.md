# Sistema de Busca Inteligente com Elasticsearch

## 🎯 Visão Geral

Esta implementação adiciona um sistema de busca inteligente usando Elasticsearch ao S2Mangas, mantendo total compatibilidade com o sistema SQL existente. O sistema funciona com fallback automático, garantindo que a aplicação continue funcionando mesmo quando o Elasticsearch não estiver disponível.

## 🏗️ Arquitetura

### Componentes Implementados

1. **ElasticsearchService** (`src/services/ElasticsearchService.ts`)
   - Gerenciamento de conexão com Elasticsearch
   - Indexação de mangás com scoring de popularidade
   - Busca full-text com análise avançada de texto
   - Autocomplete com sugestões em tempo real

2. **SmartSearchHandler** (`src/modules/search/handlers/SmartSearchHandler.ts`)
   - Orquestração inteligente entre Elasticsearch e SQL
   - Fallback automático para busca SQL
   - Métricas de performance e saúde do sistema
   - Detecção de intenção de busca

3. **Novos Endpoints** (atualizados em `SearchController.ts`)
   - `GET /search/smart` - Busca inteligente
   - `GET /search/autocomplete` - Sugestões em tempo real
   - `GET /search/health` - Status do sistema de busca

## 🚀 Como Usar

### 1. Setup do Ambiente

#### Opção A: Docker Compose (Recomendado)
```bash
# Iniciar todos os serviços incluindo Elasticsearch
docker-compose up -d

# Verificar se todos os serviços estão rodando
docker-compose ps
```

#### Opção B: Elasticsearch Local
```bash
# Instalar e iniciar Elasticsearch
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0

# Verificar se está funcionando
curl http://localhost:9200
```

### 2. Configuração de Variáveis de Ambiente

Adicione ao seu `.env`:
```bash
# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=changeme
```

### 3. Inicialização do Índice

```bash
# Verificar saúde do sistema
npm run elasticsearch:health

# Inicializar índice e indexar dados existentes
npm run elasticsearch:init
```

### 4. Testando os Novos Endpoints

#### Busca Inteligente
```bash
# Busca básica
curl "http://localhost:3000/search/smart?name=one%20piece" \
  -H "Authorization: Bearer <seu-token>"

# Busca avançada com filtros
curl "http://localhost:3000/search/smart?name=action&categories=Ação&type=Manga&page=1&limit=10" \
  -H "Authorization: Bearer <seu-token>"
```

#### Autocomplete
```bash
# Sugestões em tempo real
curl "http://localhost:3000/search/autocomplete?q=one"

# Com idioma específico
curl "http://localhost:3000/search/autocomplete/pt-BR?q=one"
```

#### Status da Busca
```bash
# Verificar saúde do sistema
curl "http://localhost:3000/search/health"
```

## 📊 Funcionalidades

### Busca Inteligente
- **Full-text search** com análise de texto em português
- **Fuzzy matching** para tolerância a erros de digitação
- **Sinônimos** automáticos (manga/manhwa/manhua, etc.)
- **Boost de relevância** baseado em popularidade
- **Busca em múltiplos campos**: título, descrição, categorias

### Autocomplete
- **Sugestões em tempo real** conforme o usuário digita
- **N-gram analysis** para matches parciais
- **Contexto por idioma** para resultados relevantes
- **Scoring de relevância** para ordenação inteligente

### Sistema de Fallback
- **Detecção automática** da disponibilidade do Elasticsearch
- **Fallback transparente** para busca SQL quando necessário
- **Métricas de performance** para monitoramento
- **Logs detalhados** para debugging

### Indexação Inteligente
- **Scoring de popularidade** baseado em views, likes, comentários e rating
- **Processamento de texto** com stop words e stemming
- **Estrutura aninhada** para traduções e categorias
- **Indexação incremental** e bulk operations

## 🔧 Configuração Avançada

### Mapping do Índice Elasticsearch

O sistema cria automaticamente um índice otimizado com:

```json
{
  "mappings": {
    "properties": {
      "translations": {
        "type": "nested",
        "properties": {
          "name": {
            "type": "text",
            "analyzer": "manga_analyzer",
            "fields": {
              "keyword": { "type": "keyword" },
              "suggest": { "type": "completion" },
              "ngram": { "type": "text", "analyzer": "ngram_analyzer" }
            }
          }
        }
      }
    }
  }
}
```

### Analyzers Customizados

- **manga_analyzer**: Análise completa com stop words e sinônimos
- **ngram_analyzer**: N-gramas para autocomplete
- **category_analyzer**: Análise simples para categorias

### Filtros de Sinônimos

```json
{
  "synonyms": [
    "manga,manhwa,manhua",
    "shounen,shonen",
    "shoujo,shojo",
    "romance,amor",
    "ação,action,luta"
  ]
}
```

## 📈 Monitoramento

### Métricas Disponíveis

1. **Performance Metrics**
   - Tempo de resposta (Elasticsearch vs SQL)
   - Taxa de sucesso das queries
   - Uso de cache

2. **Health Checks**
   - Status do Elasticsearch
   - Disponibilidade do fallback SQL
   - Recomendação de tipo de busca

3. **Logs Estruturados**
   - Queries executadas
   - Fallbacks utilizados
   - Erros e warnings

### Dashboard de Monitoramento

Acesse o Kibana para visualização avançada:
```
http://localhost:5601
```

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Apenas testes do SmartSearchHandler
npm test -- --testPathPattern="SmartSearchHandler.test.ts"

# Testes do módulo search completo
npm test -- src/modules/search/__tests__/
```

### Cobertura de Testes
- ✅ Fallback para SQL quando Elasticsearch indisponível
- ✅ Tratamento de erros e edge cases
- ✅ Validação de parâmetros
- ✅ Métricas de performance
- ✅ Health checks

## 🔄 Migração Gradual

### Estratégia de Implementação

1. **Fase 1**: Sistema funciona 100% com SQL (atual)
2. **Fase 2**: Elasticsearch adicionado como enhancement (implementado)
3. **Fase 3**: Gradual migração de tráfego para Elasticsearch
4. **Fase 4**: SQL mantido apenas como fallback

### Rollback Seguro

O sistema foi projetado para permitir rollback instantâneo:
- Desabilitar Elasticsearch: basta parar o serviço
- Sistema automaticamente detecta e usa SQL
- Zero downtime na transição

## 🚨 Troubleshooting

### Problemas Comuns

#### Elasticsearch não conecta
```bash
# Verificar se está rodando
curl http://localhost:9200

# Logs do container
docker logs s2mangas_elasticsearch

# Verificar variáveis de ambiente
npm run elasticsearch:health
```

#### Performance lenta
```bash
# Verificar índices
curl "http://localhost:9200/_cat/indices?v"

# Statistics do índice
curl "http://localhost:9200/manga_index/_stats"
```

#### Dados não indexados
```bash
# Re-indexar tudo
npm run elasticsearch:init

# Verificar total de documentos
curl "http://localhost:9200/manga_index/_count"
```

### Logs de Debug

Ative logs detalhados adicionando ao `.env`:
```bash
LOG_LEVEL=debug
ELASTICSEARCH_DEBUG=true
```

## 🎛️ Configurações de Produção

### Elasticsearch em Produção

```bash
# Variáveis para produção
ELASTICSEARCH_URL=https://your-cluster.elastic-cloud.com:9243
ELASTICSEARCH_USER=your_username  
ELASTICSEARCH_PASSWORD=secure_password
ELASTICSEARCH_TIMEOUT=10000
```

### Otimizações Recomendadas

1. **Recursos do Elasticsearch**
   - Mínimo: 1GB RAM, 2 CPU cores
   - Recomendado: 2GB RAM, 4 CPU cores
   - Para large datasets: 4GB+ RAM

2. **Configuração de Cache**
   - TTL do Redis ajustado para sugestões
   - Cache de resultados de busca frequentes

3. **Rate Limiting**
   - Autocomplete: máximo 10 req/sec por usuário
   - Busca: máximo 50 req/min por usuário

## 🔮 Próximos Passos

### Funcionalidades Planejadas

1. **Busca Semântica com IA**
   - Integração com embeddings
   - Busca por similaridade de contexto
   - Recomendações baseadas em IA

2. **Analytics Avançados**
   - Tracking de queries populares
   - A/B testing de algoritmos
   - Métricas de relevância

3. **Personalização**
   - Histórico de busca do usuário
   - Preferências personalizadas
   - Boost baseado no comportamento

## 🤝 Contribuindo

Para contribuir com melhorias:

1. Teste localmente com `npm run elasticsearch:init`
2. Execute todos os testes com `npm test`
3. Verifique TypeScript com `npm run type-check`
4. Monitore performance com endpoints de health

## 📚 Referências

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Elasticsearch Node.js Client](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html)
- [Text Analysis in Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html)