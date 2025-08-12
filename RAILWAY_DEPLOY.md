# 🚀 Deploy S2Mangas Backend no Railway

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app)
- Repositório Git configurado
- Variáveis de ambiente configuradas

## 🔧 Configuração do Railway

### 1. Variáveis de Ambiente Obrigatórias

Configure as seguintes variáveis no Railway:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Redis
REDIS_URL=redis://user:password@host:port

# Authentication
JWT_SECRET=seu_jwt_secret_super_seguro
NEXTAUTH_SECRET=seu_nextauth_secret_super_seguro
NEXTAUTH_URL=https://seu-dominio.railway.app

# Environment
NODE_ENV=production
PORT=$PORT

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app

# CDN (opcional)
CDN_URL=https://seu-cdn.com
```

### 2. Comandos de Build e Start

**Build Command:**
```bash
npm run railway:build
```

**Start Command:**
```bash
npm run railway:start
```

### 3. Configuração de Serviços

#### PostgreSQL
1. Adicione o serviço PostgreSQL no Railway
2. Copie a `DATABASE_URL` gerada
3. Configure a variável no seu projeto

#### Redis
1. Adicione o serviço Redis no Railway
2. Copie a `REDIS_URL` gerada
3. Configure a variável no seu projeto

## 🐛 Soluções para Problemas Comuns

### Erro: "npm install did not complete successfully"

**Solução 1: Limpar Cache**
```bash
# No Railway, use o build command personalizado:
npm run railway:build
```

**Solução 2: Verificar Node.js Version**
- Certifique-se que o arquivo `.nvmrc` está presente
- Versão especificada: Node.js 18

**Solução 3: Dependências**
- Todas as dependências estão listadas corretamente no `package.json`
- O script `postinstall` gera automaticamente o Prisma Client

### Erro: "Prisma Client not generated"

**Solução:**
```bash
# O script railway:build já inclui:
npx prisma generate
```

### Erro: "Database connection failed"

**Solução:**
1. Verifique se a `DATABASE_URL` está correta
2. Execute as migrações:
```bash
npx prisma migrate deploy
```

### Erro: "Redis connection failed"

**Solução:**
1. Verifique se a `REDIS_URL` está correta
2. Certifique-se que o serviço Redis está ativo

## 📊 Monitoramento

### Health Check
O endpoint `/health` está disponível para monitoramento:

```bash
GET https://seu-app.railway.app/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Logs
Para visualizar logs no Railway:
1. Acesse o dashboard do projeto
2. Clique na aba "Logs"
3. Monitore erros e performance

## 🔄 Deploy Automático

Para configurar deploy automático:
1. Conecte seu repositório GitHub ao Railway
2. Configure o branch principal (main/master)
3. Cada push acionará um novo deploy

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] PostgreSQL service adicionado
- [ ] Redis service adicionado
- [ ] Build command configurado: `npm run railway:build`
- [ ] Start command configurado: `npm run railway:start`
- [ ] Health check funcionando
- [ ] Migrações do banco executadas
- [ ] Logs sem erros críticos

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no Railway dashboard
2. Teste o health check endpoint
3. Confirme todas as variáveis de ambiente
4. Verifique conectividade com PostgreSQL e Redis

---

**Última atualização:** Janeiro 2024
**Versão do Node.js:** 18.x
**Versão do Railway:** Latest