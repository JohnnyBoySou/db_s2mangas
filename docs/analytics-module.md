# Módulo Analytics

## Visão Geral

O módulo **Analytics** é responsável por fornecer métricas, estatísticas e dados analíticos da plataforma S2Mangas. Este módulo oferece insights detalhados sobre o comportamento dos usuários, popularidade de mangás, tendências de visualização e estatísticas gerais da plataforma.

## Estrutura do Diretório

```
src/modules/analytics/
├── controllers/
│   └── AnalyticsController.ts    # Controladores e documentação Swagger
├── handlers/
│   └── AnalyticsHandler.ts       # Lógica de negócio e processamento de dados
└── routes/
    └── AnalyticsRouter.ts        # Definição das rotas administrativas
```

## Funcionalidades Principais

### 1. Estatísticas Gerais
- **Total de usuários** registrados na plataforma
- **Total de mangás** cadastrados
- **Total de capítulos** disponíveis
- **Total de visualizações** acumuladas
- **Total de curtidas** e **comentários**

### 2. Análise Temporal
- **Visualizações por período**: Dados agrupados por data em um intervalo específico
- **Usuários registrados por período**: Crescimento de usuários ao longo do tempo
- Suporte a filtros de data (startDate/endDate)

### 3. Rankings e Popularidade
- **Mangás mais visualizados**: Top mangás por número de visualizações
- **Mangás mais curtidos**: Top mangás por número de curtidas
- **Mangás mais comentados**: Top mangás por engajamento
- **Usuários mais ativos**: Ranking baseado em visualizações, curtidas e comentários

### 4. Estatísticas Categóricas
- **Estatísticas por categoria**: Distribuição de mangás por categoria
- **Estatísticas por idioma**: Distribuição de mangás por idioma
- **Estatísticas por tipo**: Distribuição por tipo de mangá (Manga, Manhwa, Manhua)
- **Estatísticas por status**: Distribuição por status de publicação

### 5. Dashboard Completo
- **Dados unificados**: Endpoint que retorna todos os dados necessários para dashboard
- **Metadados para gráficos**: Dados pré-formatados para diferentes tipos de visualização
- **Processamento paralelo**: Otimização de performance com Promise.all

## Rotas da API

### Rotas Administrativas (AdminAnalyticsRouter)

| Método | Endpoint | Descrição |
|--------|----------|----------|
| GET | `/analytics/ping` | Verificar status da conexão |
| GET | `/analytics/stats/general` | Estatísticas gerais da plataforma |
| GET | `/analytics/stats/views` | Visualizações por período |
| GET | `/analytics/stats/users` | Usuários registrados por período |
| GET | `/analytics/manga/most-viewed` | Mangás mais visualizados |
| GET | `/analytics/manga/most-liked` | Mangás mais curtidos |
| GET | `/analytics/manga/most-commented` | Mangás mais comentados |
| GET | `/analytics/users/most-active` | Usuários mais ativos |
| GET | `/analytics/stats/categories` | Estatísticas por categoria |
| GET | `/analytics/stats/languages` | Estatísticas por idioma |
| GET | `/analytics/stats/manga-types` | Estatísticas por tipo de mangá |
| GET | `/analytics/stats/manga-status` | Estatísticas por status |
| GET | `/analytics/stats/dashboard` | Dados completos do dashboard |

### Parâmetros Comuns

- **startDate** (query): Data inicial no formato YYYY-MM-DD
- **endDate** (query): Data final no formato YYYY-MM-DD
- **limit** (query): Número máximo de resultados (1-100, padrão: 10)

## Schemas de Dados

### GeneralStats
```typescript
{
  totalUsers: number;
  totalMangas: number;
  totalChapters: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}
```

### ViewData / UserData
```typescript
{
  date: string; // ISO date
  count: number;
}
```

### MangaRanking
```typescript
{
  id: string; // UUID
  title: string;
  views: number;
  likes: number;
  comments: number;
}
```

### ActiveUser
```typescript
{
  id: string; // UUID
  name: string;
  username: string;
  views: number;
  likes: number;
  comments: number;
  total: number;
}
```

### DashboardData
```typescript
{
  generalStats: GeneralStats;
  timeSeriesData: {
    viewsByPeriod: ViewData[];
    usersByPeriod: UserData[];
  };
  mangaRankings: {
    mostViewed: MangaRanking[];
    mostLiked: MangaRanking[];
    mostCommented: MangaRanking[];
  };
  userStats: {
    mostActive: ActiveUser[];
  };
  categoryData: {
    categories: CategoryStat[];
    languages: LanguageStat[];
    mangaTypes: TypeStat[];
    mangaStatus: StatusStat[];
  };
  chartMetadata: {
    period: { startDate: Date; endDate: Date };
    pieChartData: ChartDataPoint[];
    lineChartData: LineChartPoint[];
    barChartData: BarChartData[];
  };
}
```

## Funcionalidades Avançadas

### 1. Formatação para Gráficos
- **Dados para gráficos de pizza**: Categorias, tipos, status e idiomas
- **Dados para gráficos de linha**: Séries temporais de visualizações e usuários
- **Dados para gráficos de barra**: Rankings de mangás e usuários

### 2. Otimização de Performance
- **Processamento paralelo**: Uso de Promise.all para consultas simultâneas
- **Agregações no banco**: Uso de groupBy e count para eficiência
- **Inclusão seletiva**: Include apenas dos dados necessários

### 3. Validação de Dados
- **Validação de datas**: Verificação de startDate e endDate obrigatórios
- **Validação de limites**: Controle de quantidade máxima de resultados
- **Tratamento de erros**: Uso do handleZodError para respostas consistentes

## Tratamento de Erros

- **400 Bad Request**: Datas inválidas ou parâmetros obrigatórios ausentes
- **500 Internal Server Error**: Erros de banco de dados ou processamento
- **Mensagens padronizadas**: Uso do schema Error para respostas consistentes

## Dependências

- **@prisma/client**: ORM para acesso ao banco de dados
- **express**: Framework web para rotas e middlewares
- **@/utils/zodError**: Utilitário para tratamento de erros

## Segurança

- **Acesso administrativo**: Todas as rotas são administrativas (AdminAnalyticsRouter)
- **Validação de entrada**: Verificação de parâmetros de query
- **Sanitização de dados**: Prevenção de injection através do Prisma ORM

## Integração com Outros Módulos

- **Auth**: Dependência dos middlewares de autenticação administrativa
- **Manga**: Análise de dados de mangás, visualizações e curtidas
- **Users**: Análise de comportamento e atividade dos usuários
- **Comments**: Métricas de engajamento através de comentários

## Considerações de Performance

1. **Índices de banco**: Campos de data e contadores devem ter índices apropriados
2. **Cache**: Considerar implementação de cache para estatísticas que mudam pouco
3. **Paginação**: Limitação de resultados para evitar sobrecarga
4. **Agregações**: Uso de funções de agregação do banco para eficiência

## Próximas Melhorias

1. **Cache Redis**: Implementar cache para estatísticas frequentemente acessadas
2. **Filtros avançados**: Adicionar mais opções de filtro por categoria, idioma, etc.
3. **Exportação de dados**: Funcionalidade para exportar relatórios em CSV/PDF
4. **Alertas**: Sistema de notificações para métricas importantes
5. **Analytics em tempo real**: WebSocket para atualizações em tempo real
6. **Comparação temporal**: Funcionalidades para comparar períodos diferentes

## Testes

O módulo deve incluir testes para:
- Validação de parâmetros de entrada
- Cálculo correto de estatísticas
- Formatação adequada de dados para gráficos
- Tratamento de casos extremos (dados vazios, datas inválidas)
- Performance com grandes volumes de dados

## Documentação Swagger

Todos os endpoints estão documentados com Swagger, incluindo:
- Descrição detalhada de cada endpoint
- Parâmetros de entrada e validação
- Schemas de resposta
- Códigos de status HTTP
- Exemplos de uso