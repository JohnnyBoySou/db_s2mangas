# DB S2 Mangas API

Uma API completa para gerenciamento de mangás, desenvolvida com Node.js, TypeScript, Prisma e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Express** - Framework web
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **Redis** - Cache e sessões
- **Docker** - Containerização
- **Jest** - Testes unitários
- **Zod** - Validação de schemas
- **Node-cron** - Tarefas agendadas

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (Redis, Nodemailer, Proxy)
├── constants/       # Constantes da aplicação
├── controllers/     # Controladores das rotas
├── handlers/        # Lógica de negócio
├── interfaces/      # Interfaces TypeScript
├── middlewares/     # Middlewares (Auth, Cache, Admin)
├── routes/          # Definição das rotas
├── schemas/         # Schemas de validação
├── scripts/         # Scripts e tarefas agendadas
├── types/           # Tipos TypeScript
├── utils/           # Utilitários e helpers
└── validators/      # Validadores Zod
```

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd db_s2mangas
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute as migrações do banco:
```bash
npx prisma migrate dev
```

5. Popule o banco com dados iniciais:
```bash
npx prisma db seed
```

## 🐳 Docker

Para executar com Docker:

```bash
docker-compose up -d
```

## 📊 Funcionalidades

### ✅ Implementadas

#### **Autenticação & Usuários**
- [x] Registro e login de usuários
- [x] Verificação de email
- [x] Recuperação de senha
- [x] Tokens de refresh
- [x] Sistema de administradores
- [x] Perfis de usuário

#### **Mangás & Conteúdo**
- [x] CRUD de mangás
- [x] Capítulos e páginas
- [x] Categorias
- [x] Sistema de busca
- [x] Descoberta de conteúdo
- [x] Wallpapers

#### **Interações Sociais**
- [x] Sistema de comentários
- [x] Reviews e avaliações
- [x] Sistema de likes/follows
- [x] Notificações
- [x] Coleções personalizadas
- [x] Playlists

#### **Biblioteca & Progresso**
- [x] Biblioteca pessoal
- [x] Progresso de leitura
- [x] Favoritos
- [x] Histórico de leitura

#### **Sistema de Arquivos**
- [x] Upload de imagens
- [x] Gerenciamento de arquivos
- [x] Limpeza automática de arquivos órfãos

#### **Analytics & Monitoramento**
- [x] Sistema de analytics
- [x] Métricas de uso
- [x] Relatórios automatizados

#### **Sistema de Cache**
- [x] Cache Redis
- [x] Middleware de cache
- [x] Invalidação automática

### 🔄 Tarefas Agendadas

O sistema possui tarefas automatizadas que executam em horários específicos:

- **00:00** - Limpeza de arquivos órfãos (diariamente)
- **01:00** - Backup do banco de dados (diariamente)
- **02:00** - Verificação de integridade do sistema (domingos)
- **03:00** - Limpeza de cache Redis (diariamente)
- **04:00** - Limpeza de notificações antigas (domingos)
- **05:00** - Geração de relatórios de analytics (domingos)

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia o servidor em modo desenvolvimento
npm run build        # Compila o TypeScript
npm start            # Inicia o servidor em produção

# Banco de dados
npm run db:migrate   # Executa migrações
npm run db:seed      # Popula o banco com dados iniciais
npm run db:studio    # Abre o Prisma Studio

# Testes
npm test             # Executa os testes
npm run test:watch   # Executa testes em modo watch
```

## 📡 Principais Endpoints

### Autenticação
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login
- `POST /auth/refresh` - Renovar token
- `POST /auth/forgot-password` - Recuperar senha

### Mangás
- `GET /manga` - Listar mangás
- `GET /manga/:id` - Detalhes do mangá
- `POST /manga` - Criar mangá (admin)
- `PUT /manga/:id` - Atualizar mangá (admin)

### Biblioteca
- `GET /library` - Biblioteca do usuário
- `POST /library/add` - Adicionar à biblioteca
- `PUT /library/progress` - Atualizar progresso

### Busca & Descoberta
- `GET /search` - Buscar conteúdo
- `GET /discover` - Descobrir novos mangás
- `GET /categories` - Listar categorias

## 🔒 Segurança

- Autenticação JWT
- Validação de dados com Zod
- Middleware de autorização
- Rate limiting
- Sanitização de inputs
- CORS configurado

## 📈 Monitoramento

- Logs estruturados com Winston
- Métricas de performance
- Health checks automáticos
- Relatórios de integridade do sistema

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **João Victor de Sousa** - *Desenvolvedor Principal*

---

⭐ Se este projeto te ajudou, considere dar uma estrela!