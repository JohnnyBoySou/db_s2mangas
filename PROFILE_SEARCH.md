# Sistema de Busca e Perfis Similares

Este documento descreve as novas funcionalidades implementadas para busca de perfis e descoberta de perfis similares.

## 🔍 Busca de Perfis

### Endpoint
```
GET /profile/search
```

### Parâmetros de Query
- `q` (obrigatório): Termo de busca (1-100 caracteres)
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10, máximo: 50)

### Exemplo de Uso
```bash
GET /profile/search?q=joão&page=1&limit=10
```

### Resposta
```json
{
  "profiles": [
    {
      "id": "uuid",
      "name": "João Silva",
      "username": "joao123",
      "avatar": "url_do_avatar",
      "bio": "Descrição do perfil",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "likes": 15,
        "followers": 42,
        "following": 38,
        "libraryEntries": 156,
        "collections": 3
      },
      "isFollowing": false,
      "isLiked": false
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Funcionalidades da Busca
- **Busca por username**: Encontra perfis pelo nome de usuário
- **Busca por nome**: Encontra perfis pelo nome real
- **Busca por termos**: Divide a query em palavras e busca cada uma
- **Case insensitive**: Não diferencia maiúsculas de minúsculas
- **Ordenação inteligente**: Por popularidade, atividade e data de criação
- **Relacionamentos**: Mostra se o usuário autenticado segue/curtiu cada perfil

## 👥 Perfis Similares

### Endpoint
```
GET /profile/:userId/similar
```

### Parâmetros
- `userId` (obrigatório): ID do usuário para encontrar similares
- `limit` (opcional): Número de perfis a retornar (padrão: 10, máximo: 20)

### Exemplo de Uso
```bash
GET /profile/123e4567-e89b-12d3-a456-426614174000/similar?limit=5
```

### Resposta
```json
{
  "profiles": [
    {
      "id": "uuid",
      "name": "Maria Santos",
      "username": "maria_manga",
      "avatar": "url_do_avatar",
      "bio": "Amante de mangás shoujo",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "_count": {
        "likes": 28,
        "followers": 67,
        "following": 45,
        "libraryEntries": 203,
        "collections": 5
      },
      "isFollowing": false,
      "isLiked": false,
      "similarityScore": 15.2
    }
  ]
}
```

### Algoritmo de Similaridade

O sistema calcula um score de similaridade baseado em:

1. **Categorias preferidas em comum** (3 pontos cada)
   - Compara as categorias que o usuário marcou como preferidas

2. **Idiomas em comum** (2 pontos cada)
   - Compara os idiomas preferidos dos usuários

3. **Categorias de mangás lidos** (implícito)
   - Analisa as categorias dos mangás que ambos leram

4. **Popularidade** (até 5 pontos)
   - Usuários com mais seguidores recebem pontos extras
   - Fórmula: `Math.min(seguidores / 10, 5)`

5. **Atividade** (até 3 pontos)
   - Usuários mais ativos recebem pontos extras
   - Fórmula: `Math.min(entradas_biblioteca / 20, 3)`

### Filtros Aplicados
- **Exclui usuários já seguidos**: Não sugere perfis que o usuário já segue
- **Exclui o próprio usuário**: Não sugere o próprio perfil
- **Ordena por similaridade**: Perfis com maior score aparecem primeiro

## 🔐 Autenticação

Ambos os endpoints requerem autenticação via token JWT. O middleware `requireAuth` é aplicado automaticamente.

## 📊 Performance

### Otimizações Implementadas
- **Paginação**: Evita carregar muitos resultados de uma vez
- **Seleção específica**: Busca apenas os campos necessários
- **Índices**: Utiliza índices existentes no banco de dados
- **Limite de dados**: Limita a análise de mangás lidos para performance
- **Batch queries**: Usa Promise.all para consultas paralelas

### Considerações de Cache

Para melhor performance em produção, considere implementar cache para:
- Resultados de busca frequentes
- Perfis similares (cache por algumas horas)
- Contadores de relacionamentos

## 🚀 Exemplos de Integração

### Frontend - Busca de Perfis
```javascript
const searchProfiles = async (query, page = 1) => {
  const response = await fetch(
    `/api/profile/search?q=${encodeURIComponent(query)}&page=${page}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};
```

### Frontend - Perfis Similares
```javascript
const getSimilarProfiles = async (userId, limit = 10) => {
  const response = await fetch(
    `/api/profile/${userId}/similar?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};
```

## 🔧 Configuração

### Limites Configuráveis
- Busca: máximo 50 resultados por página
- Perfis similares: máximo 20 resultados
- Query de busca: 1-100 caracteres
- Análise de mangás: limitada a 100 entradas por usuário

### Validação
Todos os parâmetros são validados usando Zod schemas:
- Tipos corretos
- Limites respeitados
- UUIDs válidos
- Mensagens de erro descritivas

## 🐛 Tratamento de Erros

### Códigos de Status
- `200`: Sucesso
- `400`: Dados inválidos (parâmetros incorretos)
- `401`: Não autenticado
- `404`: Usuário não encontrado (apenas para perfis similares)
- `500`: Erro interno do servidor

### Exemplos de Erro
```json
{
  "error": "Dados inválidos",
  "details": ["Query é obrigatória"]
}
```

```json
{
  "error": "Usuário não encontrado"
}
```