# 🔧 Solução para Erro P1001 no Railway

## 📋 Problema
```
Error: P1001: Can't reach database server at `postgres.railway.internal:5432`
```

## 🔍 Diagnóstico

O erro P1001 indica que a aplicação não consegue se conectar ao servidor PostgreSQL no Railway. Isso geralmente acontece por um dos seguintes motivos:

1. **Serviço PostgreSQL não está rodando**
2. **URL do banco incorreta**
3. **Problemas de rede entre serviços**
4. **Credenciais incorretas**
5. **Banco de dados não existe**

## 🛠️ Soluções

### 1. Verificar Serviço PostgreSQL

1. Acesse o [dashboard do Railway](https://railway.app/dashboard)
2. Navegue até seu projeto
3. Verifique se o serviço PostgreSQL está **ativo** e **rodando**
4. Se não estiver, clique em "Start" ou "Restart"

### 2. Verificar DATABASE_URL

1. No dashboard do Railway, vá em **Variables**
2. Verifique se `DATABASE_URL` está configurada corretamente
3. O formato deve ser: `postgresql://user:password@host:port/database`

### 3. Verificar Conectividade

Execute o script de diagnóstico:

```bash
npm run railway:diagnose
```

Ou o troubleshooting completo:

```bash
npm run railway:troubleshoot
```

### 4. Soluções Específicas

#### Solução A: Reiniciar Serviços
1. No Railway, pare o serviço PostgreSQL
2. Aguarde 30 segundos
3. Inicie novamente o PostgreSQL
4. Reinicie sua aplicação

#### Solução B: Verificar Rede
1. Certifique-se que ambos os serviços estão na mesma rede
2. Verifique se não há firewall bloqueando a porta 5432
3. Confirme se o hostname está correto

#### Solução C: Usar URL Externa
Se disponível, use a URL externa do PostgreSQL:
1. No dashboard do PostgreSQL, copie a **External URL**
2. Configure como `DATABASE_URL` no seu projeto

#### Solução D: Recriar Serviço PostgreSQL
1. Delete o serviço PostgreSQL atual
2. Crie um novo serviço PostgreSQL
3. Configure a nova `DATABASE_URL`
4. Execute as migrações novamente

## 🚀 Scripts de Inicialização Melhorados

### Novo Script de Inicialização
O projeto agora usa um script de inicialização mais robusto que:
- Tenta conectar várias vezes antes de falhar
- Fornece logs detalhados
- Executa verificações de saúde

```bash
npm run railway:start
```

### Scripts de Diagnóstico
```bash
# Diagnóstico do banco
npm run railway:diagnose

# Troubleshooting completo
npm run railway:troubleshoot
```

## 📊 Verificações Manuais

### 1. Testar Conexão Direta
```bash
# Se psql estiver disponível
psql "sua_DATABASE_URL" -c "SELECT version();"
```

### 2. Verificar Logs
```bash
# No Railway CLI
railway logs

# Ou no dashboard
# Vá em Logs > Selecione o serviço
```

### 3. Verificar Variáveis
```bash
# No Railway CLI
railway variables

# Ou no dashboard
# Vá em Variables
```

## 🔧 Configuração Recomendada

### Variáveis de Ambiente Obrigatórias
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=$PORT
JWT_SECRET=seu_jwt_secret
```

### Variáveis Opcionais
```bash
REDIS_URL=redis://host:port
NEXTAUTH_SECRET=seu_nextauth_secret
NEXTAUTH_URL=https://seu-dominio.railway.app
```

## 🚨 Problemas Comuns

### 1. Hostname Incorreto
- **Problema**: `postgres.railway.internal` não resolve
- **Solução**: Use o hostname correto do serviço PostgreSQL

### 2. Porta Bloqueada
- **Problema**: Porta 5432 não está acessível
- **Solução**: Verifique configurações de firewall e rede

### 3. Credenciais Inválidas
- **Problema**: Usuário/senha incorretos
- **Solução**: Verifique as credenciais no dashboard do PostgreSQL

### 4. Banco Não Existe
- **Problema**: Banco de dados não foi criado
- **Solução**: Crie o banco ou use um existente

## 📞 Suporte

Se o problema persistir:

1. **Verifique os logs** no dashboard do Railway
2. **Execute os scripts de diagnóstico** fornecidos
3. **Entre em contato** com o suporte do Railway
4. **Considere usar** um banco PostgreSQL externo (Supabase, Neon, etc.)

## 🔄 Próximos Passos

1. Execute `npm run railway:troubleshoot`
2. Verifique o dashboard do Railway
3. Teste com o novo script de inicialização
4. Se necessário, recrie o serviço PostgreSQL

---

**Última atualização**: Janeiro 2024
**Versão**: 1.0.1

