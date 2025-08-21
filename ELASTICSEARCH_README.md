# 🔍 Sistema de Busca Inteligente - Guia Rápido

## ✨ Novidades Implementadas

### 🚀 Busca Inteligente com Elasticsearch
- **Busca full-text avançada** com análise de texto em português
- **Autocomplete em tempo real** com sugestões inteligentes  
- **Fallback automático** para SQL quando Elasticsearch indisponível
- **Métricas de performance** e monitoramento de saúde

### 📊 Novos Endpoints

#### 🔍 Busca Inteligente
```http
GET /search/smart?name=one%20piece&categories=Ação&type=Manga
Authorization: Bearer <token>
```

#### 💡 Autocomplete
```http
GET /search/autocomplete?q=one
# Sem autenticação necessária
```

#### 🏥 Health Check
```http
GET /search/health
# Retorna status do Elasticsearch e SQL
```

## 🏃‍♂️ Setup Rápido

### 1. Iniciar com Docker
```bash
# Subir todos os serviços (incluindo Elasticsearch)
docker-compose up -d

# Verificar se tudo está funcionando
docker-compose ps
```

### 2. Verificar Status
```bash
# Checar saúde do sistema de busca
npm run elasticsearch:health
```

### 3. Inicializar Índices
```bash
# Criar índice e indexar dados existentes
npm run elasticsearch:init
```

## 🧪 Testando

### Busca Básica
```bash
curl "http://localhost:3000/search/smart?name=naruto" \
  -H "Authorization: Bearer <seu-token>"
```

### Autocomplete
```bash
curl "http://localhost:3000/search/autocomplete?q=one"
```

### Health Check
```bash
curl "http://localhost:3000/search/health"
```

## 📈 Benefícios

✅ **Compatibilidade Total**: Sistema SQL continua funcionando  
✅ **Zero Downtime**: Fallback automático em caso de problemas  
✅ **Performance Superior**: Busca otimizada com Elasticsearch  
✅ **Experiência Melhorada**: Autocomplete e busca inteligente  

## 📖 Documentação Completa

Para detalhes técnicos completos: [docs/elasticsearch-search.md](docs/elasticsearch-search.md)

## 🔧 Configuração Mínima

Adicione ao `.env`:
```bash
ELASTICSEARCH_URL=http://localhost:9200
```

O sistema detecta automaticamente se o Elasticsearch está disponível e faz fallback para SQL quando necessário.

---

**Desenvolvido como enhancement para o S2Mangas com foco em compatibilidade e performance.**