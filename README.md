# 📚 DB S2 Mangas

Uma plataforma moderna e completa para leitura e gestão de mangás, construída com as melhores tecnologias e práticas de desenvolvimento.

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express.js** - Framework web
- **Prisma** - ORM moderno
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Zod** - Validação de schemas
- **Multer** - Upload de arquivos
- **Sharp** - Processamento de imagens
- **Nodemailer** - Envio de emails

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Nginx** - Proxy reverso (produção)

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (DB, Redis, CDN)
├── controllers/     # Controladores da aplicação
├── handlers/        # Lógica de negócio
├── middlewares/     # Middlewares customizados
├── routes/          # Definição de rotas
├── utils/           # Utilitários e helpers
├── examples/        # Exemplos de uso
├── scripts/         # Scripts de manutenção
└── server.ts        # Ponto de entrada
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (ou usar Docker)
- Redis (ou usar Docker)

### 1. Clone o repositório
```bash
git clone <repository-url>
cd db_s2mangas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_s2mangas"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_L1_DB=1

# JWT
JWT_SECRET="your-super-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# CDN
CDN_ENABLED=true
CDN_BASE_URL="https://cdn.example.com"
CDN_REGIONS="us-east-1,eu-west-1,ap-southeast-1"

# Cache
CACHE_DIR="./cache"
IMAGE_CACHE_DIR="./cache/images"
L2_CACHE_MAX_SIZE=1073741824
IMAGE_CACHE_MAX_SIZE=2147483648
```

### 4. Execute com Docker (Recomendado)
```bash
# Subir todos os serviços
docker-compose up -d

# Executar migrações
npm run db:migrate

# Seed do banco (opcional)
npm run db:seed
```

### 5. Ou execute localmente
```bash
# Certifique-se que PostgreSQL e Redis estão rodando

# Execute migrações
npm run db:migrate

# Inicie o servidor
npm run dev
```

## 🚀 Funcionalidades Implementadas

### 🔐 Autenticação e Autorização
- Sistema completo de registro e login
- Autenticação JWT com refresh tokens
- Middleware de autorização para rotas protegidas
- Sistema de roles (usuário/admin)
- Recuperação de senha via email

### 📚 Gestão de Conteúdo
- CRUD completo de mangás
- Sistema de categorias e tags
- Upload e gestão de capítulos
- Sistema de avaliações e comentários
- Busca avançada com filtros

### 👥 Interações Sociais
- Sistema de likes em mangás
- Comentários com threads
- Perfis de usuário personalizáveis
- Sistema de seguidores
- Notificações em tempo real

### 📖 Biblioteca Pessoal
- Lista de leitura personalizada
- Histórico de leitura
- Marcadores de progresso
- Playlists de mangás
- Sincronização entre dispositivos

### 📁 Sistema de Arquivos
- Upload seguro de imagens
- Otimização automática de imagens
- Gestão de wallpapers
- Sistema de cache de arquivos

### 📊 Analytics
- Estatísticas de usuários
- Métricas de engajamento
- Relatórios de conteúdo
- Dashboard administrativo

### ⚡ Sistema de Cache Avançado
- **Cache Multi-Camadas**: L1 (Redis) + L2 (File System)
- **Cache Inteligente**: Prisma queries com invalidação automática
- **Otimização de Imagens**: Múltiplas resoluções e formatos (WebP, AVIF)
- **Simulação CDN**: Headers otimizados e cache de recursos estáticos
- **Invalidação Granular**: Sistema baseado em tags
- **Compressão Automática**: Redução de 60-80% no uso de memória
- **Monitoramento**: Estatísticas em tempo real e alertas
- **API de Gerenciamento**: Endpoints para controle total do cache

## ⏰ Tarefas Agendadas

O sistema inclui tarefas automatizadas que rodam em intervalos específicos:

- **Limpeza de Cache**: Remove entradas expiradas (a cada 6 horas)
- **Backup de Dados**: Backup automático do banco (diário)
- **Relatórios**: Geração de relatórios analíticos (semanal)
- **Notificações**: Envio de notificações pendentes (a cada 15 minutos)
- **Otimização**: Otimização de imagens em lote (noturno)

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor em modo desenvolvimento
npm run build        # Compila TypeScript para JavaScript
npm run start        # Inicia servidor em produção

# Banco de Dados
npm run db:migrate   # Executa migrações
npm run db:seed      # Popula banco com dados iniciais
npm run db:reset     # Reseta banco de dados
npm run db:studio    # Abre Prisma Studio

# Cache
npm run cache:clear  # Limpa todo o cache
npm run cache:warm   # Pré-aquece cache
npm run cache:stats  # Mostra estatísticas

# Utilitários
npm run lint         # Executa linter
npm run test         # Executa testes
npm run logs         # Mostra logs da aplicação
```

## 🌐 Principais Endpoints

### Autenticação
```
POST /auth/register     # Registro de usuário
POST /auth/login        # Login
POST /auth/refresh      # Renovar token
POST /auth/logout       # Logout
POST /auth/forgot       # Esqueci senha
POST /auth/reset        # Resetar senha
```

### Mangás
```
GET    /manga           # Listar mangás
GET    /manga/:id       # Detalhes do mangá
POST   /manga           # Criar mangá (admin)
PUT    /manga/:id       # Atualizar mangá (admin)
DELETE /manga/:id       # Deletar mangá (admin)
```

### Descoberta
```
GET /discover/recents   # Mangás recentes
GET /discover/popular   # Mais populares
GET /discover/trending  # Em alta
GET /discover/feed      # Feed personalizado
```

### Cache (Admin)
```
GET    /cache/stats     # Estatísticas do cache
GET    /cache/monitor   # Monitoramento em tempo real
DELETE /cache/clear     # Limpar todo cache
POST   /cache/warm      # Pré-aquecer cache
```

## 🔒 Segurança

- **Autenticação JWT** com tokens de acesso e refresh
- **Validação rigorosa** de entrada com Zod
- **Rate limiting** para prevenir abuso
- **CORS configurado** adequadamente
- **Headers de segurança** implementados
- **Sanitização** de dados de entrada
- **Logs de auditoria** para ações sensíveis

## 📊 Monitoramento

- **Logs estruturados** com diferentes níveis
- **Métricas de performance** em tempo real
- **Alertas automáticos** para problemas
- **Dashboard administrativo** com estatísticas
- **Monitoramento de cache** com hit/miss ratios
- **Análise de uso** de recursos

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição

- Siga os padrões de código estabelecidos
- Adicione testes para novas funcionalidades
- Documente mudanças significativas
- Mantenha commits pequenos e focados
- Use mensagens de commit descritivas

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **João Victor de Sousa** - *Desenvolvedor Principal* - [@joaovictordesousa](https://github.com/joaovictordesousa)

## 📚 Documentação Adicional

- [Sistema de Cache Avançado](CACHE_SYSTEM.md) - Documentação completa do sistema de cache
- [Exemplos de Uso](src/examples/cacheUsage.ts) - Exemplos práticos de implementação
- [API Reference](docs/api.md) - Documentação completa da API
- [Deployment Guide](docs/deployment.md) - Guia de deploy em produção

## 🚀 Roadmap

### Próximas Funcionalidades
- [ ] Sistema de recomendações com IA
- [ ] Chat em tempo real
- [ ] Sistema de moedas virtuais
- [ ] Marketplace de conteúdo
- [ ] App mobile (React Native)
- [ ] PWA (Progressive Web App)
- [ ] Integração com APIs externas
- [ ] Sistema de moderação automática

### Melhorias Técnicas
- [ ] Microserviços
- [ ] GraphQL API
- [ ] Elasticsearch para busca
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Monitoring com Prometheus
- [ ] Distributed tracing
- [ ] Load balancing

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela!**

📧 **Contato**: joao@example.com

🌐 **Website**: https://db-s2mangas.com